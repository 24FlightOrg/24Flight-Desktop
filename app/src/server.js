import { app, BrowserWindow, Menu, ipcMain, safeStorage, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from "express";
import { initWS, sendWS, getWSStatus, latestWorldState } from './ws/24data.js';
import discordrpcimport from './ipc/discord.cjs'
import { initAutopilot, startAutopilotPayload, updateAutopilotPayload, getAutopilotStatus, stopAutopilotPayload, setCurrentWaypoints, setCurrentAircraftState } from './ipc/index.js'
const { setupRPC, getStartTimestamp, setStartTimestamp } = discordrpcimport;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win = null;
let user_session_token;
const aircraftWindows = new Map();
let rpc = setupRPC();

export default win;

const server = express();
const SERVER_PORT = 24000;

server.use(express.static(path.join(__dirname, "../frontend")));

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

  globalShortcut.register('CommandOrControl+Shift+Alt+K', () => {
    stopAutopilotPayload();
  });

  let windowHeight = 600;
  let windowWidth = 800;
  let filePath;

  if (isLoggedIn) {
    filePath = `http://localhost:${SERVER_PORT}/index.html`
    windowHeight = 650;
    windowWidth = 1000;
  } else {
    filePath = `http://localhost:${SERVER_PORT}/login.html`
    windowHeight = 600;
    windowWidth = 800;
  }

  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    icon: path.join(process.cwd(), 'build/icons/png/1024x1024.png'),
    frame: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setTitle('');
  win.on('closed', () => {
    app.quit();
  });

  initWS(win);

  win.loadURL(filePath);
  Menu.setApplicationMenu(null);
});

ipcMain.handle('window-minimize', (event) => {
  try {
    const senderWin = BrowserWindow.fromWebContents(event.sender);
    if (senderWin && !senderWin.isDestroyed()) senderWin.minimize();
  } catch (e) {
    console.error('window-minimize error:', e);
  }
});

ipcMain.handle('window-maximize', (event) => {
  try {
    const senderWin = BrowserWindow.fromWebContents(event.sender);
    if (!senderWin || senderWin.isDestroyed()) return;
    if (senderWin.isMaximized()) {
      senderWin.unmaximize();
    } else {
      senderWin.maximize();
    }
  } catch (e) {
    console.error('window-maximize error:', e);
  }
});

ipcMain.handle('window-close', (event) => {
  try {
    const senderWin = BrowserWindow.fromWebContents(event.sender);
    if (!senderWin || senderWin.isDestroyed()) return;
    senderWin.close();
  } catch (e) {
    console.error('window-close error:', e);
  }
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
  console.log('get-username invoked. Token exists:', !!user_session_token);
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
      console.log('get-username response data:', data);
      return data.username || null;
    } else {
      console.log('get-username failed:', response.status, response.statusText);
      return null;
    }
  } catch (err) {
    console.error('Error fetching username:', err);
    return null;
  }
});

ipcMain.handle('get-globalname', async () => {
  console.log('get-globalname invoked. Token exists:', !!user_session_token);
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
      console.log('get-globalname response data:', data);
      return data.global_name || null;
    } else {
      console.log('get-globalname failed:', response.status, response.statusText);
      return null;
    }
  } catch (err) {
    console.error('Error fetching globalname:', err);
    return null;
  }
});

ipcMain.handle('get-app-version', () => {
  try {
    return app.getVersion();
  } catch (err) {
    console.error('Error getting app version:', err);
    return 'Unknown';
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

// NEW: Keep track of the interval so we can turn it off
let telemetryInterval = null; 

export let autopilotCallsign = null;

async function firstStateSet(callsign) {
  const acft = latestWorldState.d;

  const targetAircraft = acft[callsign];

  if (targetAircraft) {
    setCurrentAircraftState({
      x: targetAircraft.position.x || 0,
      y: targetAircraft.position.y || 0,
      altitude: targetAircraft.altitude || 0,
      heading: targetAircraft.heading || 0,
      speed: targetAircraft.speed || 0,
    });
    
    autopilotCallsign = callsign;
    return true;
  }

  console.log(`[State Set] Could not find aircraft with callsign: ${callsign}`);
  return false; 
}

ipcMain.on('autopilot-stop', async (event) => {
  try {
    // Stop telemetry loop
    if (telemetryInterval) {
      clearInterval(telemetryInterval);
      telemetryInterval = null;
    }

    
  } catch (err) {
    console.error('Error stopping autopilot:', err);
  }
});

ipcMain.on('autopilot-route', async (event, route) => {
  try {
    console.log('Autopilot route received from renderer:', route);
    
    if (route && route.action === 'engage') {
      console.log('autopilot engaged');
      
      if (route.route) {
        console.log('Route details:', route.route);
        const callsign = route.route.callsign || route.route.aircraft || '';
        const waypoints = Array.isArray(route.route.waypoints) ? route.route.waypoints.map((wp) => {
          if (typeof wp === 'object' && wp !== null) {
            return {
              x: Number(wp.x) || 0,
              y: Number(wp.y) || 0,
              altitude: Number(wp.altitude) || 0
            };
          }
          return wp;
        }) : [];

        try {
          // 1. SET GLOBAL WAYPOINTS (Crucial for the updater to work)
          setCurrentWaypoints(waypoints);

          await firstStateSet(callsign);

          // 2. START C++ PROCESS
          const result = await startAutopilotPayload(waypoints, callsign);

          // 3. START TELEMETRY LOOP
          // Clear any existing ghost loop just in case
          if (telemetryInterval) clearInterval(telemetryInterval);
          
          // Send data to C++ 10 times a second (100ms)
          telemetryInterval = setInterval(async () => {
            await updateAutopilotPayload();
          }, 100);

          event.sender.send('autopilot-ack', { status: 'started', action: 'engage', result, timestamp: Date.now() });
          return;
        } catch (startError) {
          console.error('Autopilot start failed:', startError);
          event.sender.send('autopilot-ack', { status: 'error', action: 'engage', error: String(startError), timestamp: Date.now() });
          return;
        }
      }
    } else if (route && route.action === 'disengage') {
      console.log('autopilot disengaged');
      
      // 1. STOP TELEMETRY LOOP
      if (telemetryInterval) {
        clearInterval(telemetryInterval);
        telemetryInterval = null;
      }

      // 2. KILL C++ PROCESS
      await stopAutopilotPayload();
      
    } else {
      console.log('autopilot action unknown:', route && route.action);
    }

    event.sender.send('autopilot-ack', { status: 'received', action: route && route.action, timestamp: Date.now() });
  } catch (err) {
    console.error('Error handling autopilot-route:', err);
    event.sender.send('autopilot-ack', { status: 'error', error: String(err), timestamp: Date.now() });
  }
});

ipcMain.handle('open-aircraft-window', (event, callsign) => {
  try {
    if (!callsign) return false;
    if (aircraftWindows.has(callsign)) {
      const w = aircraftWindows.get(callsign);
      if (w && !w.isDestroyed()) {
        w.focus();
        return true;
      }
    }

    const aircraftWindow = new BrowserWindow({
      width: 710,
      height: 550,
      frame: false,
      resizable: true,
      webPreferences: {
        devTools: false,
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    aircraftWindow.setTitle('');
    const url = `http://localhost:${SERVER_PORT}/areas/aircraft.html?callsign=${encodeURIComponent(callsign)}`;
    aircraftWindow.loadURL(url);
    aircraftWindows.set(callsign, aircraftWindow);

    aircraftWindow.on('closed', () => {
      aircraftWindows.delete(callsign);
    });

    return true;
  } catch (err) {
    console.error('Error opening aircraft window:', err);
    return false;
  }
});

ipcMain.on('aircraft-data', (event, data) => {
  try {
    for (const [callsign, w] of aircraftWindows.entries()) {
      if (w && !w.isDestroyed()) {
        w.webContents.send('aircraft-data', data);
      }
    }
  } catch (e) {
    console.error('Error forwarding aircraft-data:', e);
  }
});

ipcMain.on('flightplans-data', (event, plans) => {
  try {
    for (const [callsign, w] of aircraftWindows.entries()) {
      if (w && !w.isDestroyed()) {
        w.webContents.send('flightplans-data', plans);
      }
    }
  } catch (e) {
    console.error('Error forwarding flightplans-data:', e);
  }
});

ipcMain.on('ws-send', (event, data) => {
  sendWS(data);
});

ipcMain.handle('get-ws-status', () => {
  return getWSStatus();
});

ipcMain.handle('update-discord-activity', (event, state) => {
  updateActivity(state);
});

ipcMain.handle('autopilot-stop', () => {
  stopAutopilotPayload();
});
