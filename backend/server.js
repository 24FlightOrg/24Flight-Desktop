import { app, BrowserWindow, Menu, ipcMain, safeStorage } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let user_session_token;
const aircraftWindows = new Map();

const server = express();
const SERVER_PORT = 24000;

server.use(express.static(path.join(__dirname, "src")));

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

  win.setTitle('');
  win.on('closed', () => {
    app.quit();
  });
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
    // If this is the main window, closing it will trigger the existing 'closed' handler which quits the app.
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
      width: 420,
      height: 520,
      frame: false,
      resizable: true,
      webPreferences: {
        devTools: true,
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