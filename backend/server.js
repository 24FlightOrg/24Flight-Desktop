import { app, BrowserWindow, Menu, ipcMain, safeStorage } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let user_session_token;

const server = express();
const SERVER_PORT = 24000;

server.use(express.static(path.join(__dirname, "src")));

// FlightNet compatibility: proxy endpoints to a FlightNet instance or upstream 24data
const FLIGHTNET_BASES = [
  process.env.FLIGHTNET_URL || 'http://localhost:3003',
  'https://flightnet.24flight.org'
];

function fetchWithTimeout(url, ms = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

async function proxyJson(pathname) {
  let lastErr = null;
  for (const base of FLIGHTNET_BASES) {
    try {
      const url = new URL(pathname, base).toString();
      const res = await fetchWithTimeout(url, Number(process.env.FLIGHTNET_FETCH_TIMEOUT_MS || 3000));
      if (!res.ok) {
        lastErr = `upstream ${base} returned ${res.status}`;
        continue;
      }
      const j = await res.json();
      return { status: 200, body: j };
    } catch (err) {
      lastErr = err && err.message ? err.message : String(err);
      // try next base
    }
  }
  console.error('proxyJson error, all bases failed:', lastErr);
  return { status: 502, error: lastErr || 'all upstreams failed' };
}

server.get('/flightnet/acft-data', async (req, res) => {
  const r = await proxyJson('/api/acft-data');
  if (r.status !== 200) return res.status(r.status).json({ error: r.error || 'failed' });
  res.json(r.body);
});

server.get('/flightnet/acft-data/event', async (req, res) => {
  const r = await proxyJson('/api/acft-data/event');
  if (r.status !== 200) return res.status(r.status).json({ error: r.error || 'failed' });
  res.json(r.body);
});

server.get('/flightnet/controllers', async (req, res) => {
  const r = await proxyJson('/api/controllers');
  if (r.status !== 200) return res.status(r.status).json({ error: r.error || 'failed' });
  res.json(r.body);
});

server.get('/flightnet/atis', async (req, res) => {
  const r = await proxyJson('/api/atis');
  if (r.status !== 200) return res.status(r.status).json({ error: r.error || 'failed' });
  res.json(r.body);
});

// --- Aircraft prediction cache & endpoint ---
// Keep a short history of aircraft samples polled from FlightNet so we can compute
// simple derivatives (velocity vector, climb rate, heading rate) and extrapolate.
const ACFT_HISTORY = new Map(); // callsign -> [{ts, sample}, ...]
const HISTORY_MAX = Number(process.env.FLIGHTNET_HISTORY_MAX || 8);
const POLL_INTERVAL_MS = Number(process.env.FLIGHTNET_POLL_MS || 1000);

function knotsToStudsPerSec(knots) {
  // 1 knot = 1.687809857 ft/s. 1 stud = 1.8372 ft
  return (knots || 0) * 1.687809857 / 1.8372;
}

function headingToUnitVec(headingDeg) {
  const rad = (Number(headingDeg) || 0) * Math.PI / 180.0;
  const dx = Math.sin(rad); // +x is east
  const dy = -Math.cos(rad); // -y is north per data format
  return { dx, dy };
}

function addSampleToHistory(callsign, sample) {
  if (!callsign) return;
  const arr = ACFT_HISTORY.get(callsign) || [];
  arr.push(sample);
  while (arr.length > HISTORY_MAX) arr.shift();
  ACFT_HISTORY.set(callsign, arr);
}

async function pollAcftDataOnce() {
  try {
    const r = await proxyJson('/api/acft-data');
    if (r.status !== 200) return;
    const data = r.body || {};
    const ts = Date.now() / 1000;
    for (const [callsign, ac] of Object.entries(data)) {
      const sample = {
        ts,
        position: ac.position || null,
        altitude: typeof ac.altitude === 'number' ? ac.altitude : (ac.alt || null),
        speed: typeof ac.speed === 'number' ? ac.speed : (ac.groundSpeed || null),
        groundSpeed: ac.groundSpeed || null,
        heading: ac.heading || null,
        isOnGround: ac.isOnGround || false,
        raw: ac
      };
      addSampleToHistory(callsign, sample);
    }
  } catch (err) {
    // silent, proxyJson logs errors
  }
}

// start poller
setInterval(() => {
  pollAcftDataOnce();
}, POLL_INTERVAL_MS);

function computeDerivatives(samples, targetLagSec = 1.0) {
  if (!samples || samples.length < 2) return null;
  const b = samples[samples.length - 1];
  // find sample 'a' approximately targetLagSec before 'b'
  let a = null;
  for (let i = samples.length - 2; i >= 0; i--) {
    const cand = samples[i];
    const lag = b.ts - cand.ts;
    if (lag >= targetLagSec) {
      a = cand;
      break;
    }
  }
  if (!a) a = samples[samples.length - 2];
  const dt = b.ts - a.ts;
  if (!dt || dt <= 0) return null;
  const vx = ( (b.position && a.position) ? ((b.position.x - a.position.x) / dt) : null );
  const vy = ( (b.position && a.position) ? ((b.position.y - a.position.y) / dt) : null );
  const altRate = (typeof b.altitude === 'number' && typeof a.altitude === 'number') ? ((b.altitude - a.altitude) / dt) : null; // ft/sec
  const speedRate = (typeof b.speed === 'number' && typeof a.speed === 'number') ? ((b.speed - a.speed) / dt) : null; // knots/sec
  const headingRate = (typeof b.heading === 'number' && typeof a.heading === 'number') ? ((b.heading - a.heading) / dt) : null; // deg/sec
  return { vx, vy, altRate, speedRate, headingRate, dt };
}

function computeSmoothedDerivatives(samples, windowSec = 3.0) {
  if (!samples || samples.length < 2) return null;
  const b = samples[samples.length - 1];
  // find earliest sample within windowSec (or use earliest available)
  let a = samples[0];
  for (let i = samples.length - 2; i >= 0; i--) {
    const cand = samples[i];
    const lag = b.ts - cand.ts;
    if (lag <= windowSec) a = cand;
    else break;
  }
  const dt = b.ts - a.ts;
  if (!dt || dt <= 0) return null;
  const vx = (b.position && a.position) ? ((b.position.x - a.position.x) / dt) : null;
  const vy = (b.position && a.position) ? ((b.position.y - a.position.y) / dt) : null;
  const altRate = (typeof b.altitude === 'number' && typeof a.altitude === 'number') ? ((b.altitude - a.altitude) / dt) : null; // ft/sec
  const speedRate = (typeof b.speed === 'number' && typeof a.speed === 'number') ? ((b.speed - a.speed) / dt) : null; // knots/sec
  // heading: compute shortest signed angle difference
  let headingRate = null;
  if (typeof b.heading === 'number' && typeof a.heading === 'number') {
    let diff = ((b.heading - a.heading + 540) % 360) - 180; // -180..+180
    headingRate = diff / dt; // deg/sec
  }
  return { vx, vy, altRate, speedRate, headingRate, dt };
}

function iterativePredict(latest, deriv, horizonSec, stepSec) {
  const out = [];
  if (!latest) return out;
  // clamp reasonable values
  const maxStep = Math.max(0.01, stepSec || 0.5);
  const steps = Math.max(1, Math.ceil(horizonSec / maxStep));

  // starting state (clone shallow)
  let curr = {
    ts: latest.ts,
    position: latest.position ? { x: latest.position.x, y: latest.position.y } : null,
    altitude: typeof latest.altitude === 'number' ? latest.altitude : null,
    heading: typeof latest.heading === 'number' ? latest.heading : 0,
    speed: typeof latest.speed === 'number' ? latest.speed : 0
  };

  for (let i = 1; i <= steps; i++) {
    const dt = Math.min(maxStep, horizonSec - (i - 1) * maxStep);
    // update kinematic state using constant derivatives
    if (deriv) {
      if (typeof deriv.speedRate === 'number') curr.speed = curr.speed + deriv.speedRate * dt;
      if (typeof deriv.altRate === 'number' && typeof curr.altitude === 'number') curr.altitude = curr.altitude + deriv.altRate * dt;
      if (typeof deriv.headingRate === 'number') curr.heading = normalizeHeading(curr.heading + deriv.headingRate * dt);
    }

    // move
    if (curr.position) {
      if (deriv && typeof deriv.vx === 'number' && typeof deriv.vy === 'number') {
        curr.position.x = curr.position.x + deriv.vx * dt;
        curr.position.y = curr.position.y + deriv.vy * dt;
      } else {
        const studsPerSec = knotsToStudsPerSec(curr.speed || 0);
        const { dx, dy } = headingToUnitVec(curr.heading || 0);
        curr.position.x = curr.position.x + dx * studsPerSec * dt;
        curr.position.y = curr.position.y + dy * studsPerSec * dt;
      }
    }

    curr.ts = latest.ts + i * maxStep;
    out.push({ ts: curr.ts, position: curr.position ? { x: curr.position.x, y: curr.position.y } : null, altitude: curr.altitude, heading: curr.heading, speed: curr.speed });
  }
  return out;
}

function normalizeHeading(h) {
  let n = Number(h) || 0;
  n = ((n % 360) + 360) % 360;
  return n;
}

function predictSampleFrom(sample, dtSeconds, deriv) {
  const baseSpeed = sample.groundSpeed || sample.speed || 0;
  const speedRate = deriv && typeof deriv.speedRate === 'number' ? deriv.speedRate : 0; // knots/sec
  const altRate = deriv && typeof deriv.altRate === 'number' ? deriv.altRate : 0; // ft/sec
  const headingRate = deriv && typeof deriv.headingRate === 'number' ? deriv.headingRate : 0; // deg/sec

  const predictedSpeed = baseSpeed + speedRate * dtSeconds; // knots
  const predictedHeading = normalizeHeading((sample.heading || 0) + headingRate * dtSeconds);
  const predictedAlt = (typeof sample.altitude === 'number') ? (sample.altitude + altRate * dtSeconds) : null;

  const studsPerSec = knotsToStudsPerSec(predictedSpeed);
  const { dx, dy } = headingToUnitVec(predictedHeading);
  const nx = sample.position && typeof sample.position.x === 'number' ? (sample.position.x + dx * studsPerSec * dtSeconds) : null;
  const ny = sample.position && typeof sample.position.y === 'number' ? (sample.position.y + dy * studsPerSec * dtSeconds) : null;

  return {
    ts: (Date.now() / 1000) + dtSeconds,
    position: nx !== null && ny !== null ? { x: nx, y: ny } : null,
    altitude: predictedAlt,
    heading: predictedHeading,
    speed: predictedSpeed,
    vx: nx !== null ? ( (nx - (sample.position ? sample.position.x : nx)) / dtSeconds ) : null,
    vy: ny !== null ? ( (ny - (sample.position ? sample.position.y : ny)) / dtSeconds ) : null
  };
}

server.get('/flightnet/predict', async (req, res) => {
  // query: seconds=5,30 etc (comma-separated) or use defaults
  // optional: step=0.5 (seconds) controls prediction resolution (default 0.5s)
  const q = String(req.query.seconds || '5');
  const secs = q.split(',').map(s => Number(s)).filter(n => !isNaN(n) && n >= 0);
  if (secs.length === 0) secs.push(5, 30);
  let step = Number(req.query.step || 0.5);
  if (!step || Number.isNaN(step) || step <= 0) step = 0.5;

  // safety: cap maximum points per horizon to avoid huge responses
  const MAX_POINTS = Number(process.env.FLIGHTNET_PREDICT_MAX_POINTS || 200);

  // ensure we have latest sample by doing one immediate poll
  await pollAcftDataOnce();

  const result = {};
  for (const [callsign, samples] of ACFT_HISTORY.entries()) {
    const latest = samples[samples.length - 1];
    // use a smoothed derivative over the last few seconds
    const deriv = computeSmoothedDerivatives(samples, Number(process.env.FLIGHTNET_DERIV_WINDOW_SEC || 3.0));
    if (deriv && typeof deriv.altRate === 'number') latest.altitude_rate = deriv.altRate;
    const preds = {};
    for (const s of secs) {
      const points = Math.min(Math.ceil(s / step), MAX_POINTS);
      const actualStep = s === 0 ? step : Math.max(step, s / points);
      // generate iterative predictions step-by-step for stability
      const arr = iterativePredict(latest, deriv, s, actualStep);
      preds[`t+${s}s`] = arr;
    }
    result[callsign] = {
      latest: latest,
      derivatives: deriv,
      predictions: preds
    };
  }

  res.json({ generated: Date.now() / 1000, predictions: result, step });
});

// Returns the callsign for the currently signed-in user (based on stored token)
server.get('/flightnet/my-callsign', async (req, res) => {
  if (!user_session_token) return res.status(401).json({ error: 'not signed in' });
  try {
    const response = await fetch('https://24flight.org/oauth/@me', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user_session_token}` }
    });
    if (!response.ok) return res.status(401).json({ error: 'invalid token' });
    const js = await response.json();
    const username = js && js.username;
    if (!username) return res.status(404).json({ error: 'username not found' });

    const r = await proxyJson('/api/acft-data');
    if (r.status !== 200) return res.status(r.status).json({ error: r.error || 'failed to fetch acft data' });
    const data = r.body || {};
    for (const [callsign, ac] of Object.entries(data)) {
      if (!ac) continue;
      const names = [ac.playerName, ac.pilot, ac.pilotName, ac.discord, (ac.raw && ac.raw.playerName)];
      for (const n of names) {
        if (typeof n === 'string' && n === username) return res.json({ callsign });
      }
    }
    return res.status(404).json({ error: 'callsign not found for user' });
  } catch (err) {
    console.error('my-callsign error', err && err.message);
    return res.status(500).json({ error: err && err.message });
  }
});

server.listen(SERVER_PORT, () => {
  console.log("Local Express server running on http://localhost:" + SERVER_PORT);
});

const TOKEN_FILE = path.join(app.getPath('userData'), 'auth-token.json');

async function validateToken(token) {
  try {
    const response = await fetch('https://24flight.org/oauth/@me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (err) {
    console.error('error validating token:', err);
    return false;
  }
}

function saveToken(token) {
  try {
    const encrypted = safeStorage.encryptString(token);
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token: encrypted.toString('latin1') }));
    console.log('token saved');
  } catch (err) {
    console.error('error saving token:', err);
  }
}

function getStoredToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      console.log('tokenfile doesnt exist');
      return null;
    }
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    const encrypted = Buffer.from(data.token, 'latin1');
    const decrypted = safeStorage.decryptString(encrypted);
    console.log('token fetched');
    return decrypted;
  } catch (err) {
    console.error('error retrieving token:', err);
    return null;
  }
}

function deleteStoredToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
    user_session_token = null;
    console.log('token deleted');
  } catch (err) {
    console.error('error deleting token:', err);
  }
}

app.whenReady().then(async () => {
  let isLoggedIn = false;
  const storedToken = getStoredToken();
  
  if (storedToken) {
    console.log('found token, validating...');
    const isValid = await validateToken(storedToken);
    if (isValid) {
      user_session_token = storedToken;
      isLoggedIn = true;
      console.log('token found and checked to be valid');
    } else {
      console.log('token invalidated, deleting');
      deleteStoredToken();
      isLoggedIn = false;
    }
  } else {
    console.log('no stored token found');
    isLoggedIn = false;
  }
  
  let windowHeight = 600;
  let filePath;
  if (isLoggedIn) {
    filePath = `http://localhost:${SERVER_PORT}/index.html`
    windowHeight = 300;
  } else {
    filePath = `http://localhost:${SERVER_PORT}/login.html`
  }
  
  win = new BrowserWindow({
    width: 800,
    height: windowHeight,
    icon: path.join(__dirname, 'build/icon.ico'),
    frame: false,
    webPreferences: {
      devTools: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setTitle('24Flight');
  win.loadURL(filePath);
  Menu.setApplicationMenu(null);
});

ipcMain.handle('window-minimize', () => {
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (win) win.close();
});

ipcMain.handle('open-login', async () => {
  return new Promise((resolve, reject) => {
    if (!win) return reject(new Error('Main window not available'));

    const oauthWindow = new BrowserWindow({
      width: win.getBounds().width - 100,
      height: win.getBounds().height - 100,
      parent: win,
      modal: true,
      show: true,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        devTools: false
      }
    });

    const loginUrl = 'https://24flight.org/oauth/login';
    oauthWindow.loadURL(loginUrl);

    let finished = false;

    const handleToken = (event, url) => {
      try {
        const parsed = new URL(url);
        if (parsed.pathname == '/oauth/desktop/callback') {
          event.preventDefault()
          const token = parsed.searchParams.get('token');
          if (token && !finished) {
            finished = true;
            user_session_token = token;
            saveToken(token);
            
            const indexPath = `http://localhost:${SERVER_PORT}/index.html`
            win.loadURL(indexPath);
            
            resolve(token);
            if (!oauthWindow.isDestroyed()) oauthWindow.close();
          }
        }
      } catch (err) {
        console.error('Error parsing OAuth URL:', err);
      }
    };

    oauthWindow.webContents.on('will-redirect', (event, url) => handleToken(event, url));
    oauthWindow.webContents.on('did-navigate', (event, url) => handleToken(event, url));

    oauthWindow.webContents.setWindowOpenHandler(({ url }) => {
      handleToken(url);
      return { action: 'deny' };
    });

    oauthWindow.on('closed', () => {
      if (!finished) {
        finished = true;
        reject(new Error('OAuth window closed by user'));
      }
    });

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        if (!oauthWindow.isDestroyed()) oauthWindow.close();
        reject(new Error('OAuth login timed out'));
      }
    }, 5 * 60 * 1000);
  });
});

ipcMain.on('close-app', () => {
  app.quit();
});

ipcMain.handle('get-token', async () => {
  return user_session_token || null;
});

ipcMain.handle('get-username', async () => {
  if (!user_session_token) return null;
  try {
    const response = await fetch('https://24flight.org/oauth/@me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user_session_token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.username || null;
    } else {
      return null;
    }
  } catch (err) {
    console.error('Error fetching username:', err);
    return null;
  }
});

ipcMain.handle('logout', async () => {
  user_session_token = null;
  deleteStoredToken();
  return true;
});

ipcMain.handle('get-login', () => {
  return isLoggedIn;
});

ipcMain.on('autopilot-route', (event, route) => {
  try {
    console.log('Autopilot route received from renderer:', route);
    if (route && route.action === 'engage') {
      console.log('autopilot engaged');
      if (route.route) console.log('Route details:', route.route);
    } else if (route && route.action === 'disengage') {
      console.log('autopilot disengaged');
    } else {
      console.log('autopilot action unknown:', route && route.action);
    }

    event.sender.send('autopilot-ack', { status: 'received', action: route && route.action, timestamp: Date.now() });
  } catch (err) {
    console.error('Error handling autopilot-route:', err);
  }
});