import { app, BrowserWindow, Menu, ipcMain, safeStorage } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let user_session_token;

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
    console.error('Error validating token:', err);
    return false;
  }
}

function saveToken(token) {
  try {
    const encrypted = safeStorage.encryptString(token);
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token: encrypted.toString('latin1') }));
    console.log('Token saved to secure storage');
  } catch (err) {
    console.error('Error saving token:', err);
  }
}

function getStoredToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      console.log('Token file does not exist');
      return null;
    }
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    const encrypted = Buffer.from(data.token, 'latin1');
    const decrypted = safeStorage.decryptString(encrypted);
    console.log('Token retrieved from secure storage');
    return decrypted;
  } catch (err) {
    console.error('Error retrieving token:', err);
    return null;
  }
}

function deleteStoredToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
    user_session_token = null;
    console.log('Token deleted from secure storage');
  } catch (err) {
    console.error('Error deleting token:', err);
  }
}

app.whenReady().then(async () => {
  let isLoggedIn = false;
  const storedToken = getStoredToken();
  
  if (storedToken) {
    console.log('Found stored token, validating...');
    const isValid = await validateToken(storedToken);
    if (isValid) {
      user_session_token = storedToken;
      isLoggedIn = true;
      console.log('✓ Valid stored token found and loaded');
    } else {
      console.log('✗ Stored token is invalid, deleting it');
      deleteStoredToken();
      isLoggedIn = false;
    }
  } else {
    console.log('No stored token found');
    isLoggedIn = false;
  }
  
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setTitle('24Flight');

  let filePath;
  if (isLoggedIn) {
    filePath = pathToFileURL(path.join(__dirname, 'src/index.html')).toString();
    console.log('Loading main app (user is logged in)');
  } else {
    filePath = pathToFileURL(path.join(__dirname, 'src/login.html')).toString();
    console.log('Loading login page (user is not logged in)');
  }
  
  win.loadURL(filePath);
  Menu.setApplicationMenu(null);
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
            
            const indexPath = pathToFileURL(path.join(__dirname, 'src/index.html')).toString();
            win.loadURL(indexPath);
            
            win.webContents.send('auth-token', token);
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

ipcMain.handle('logout', async () => {
  user_session_token = null;
  deleteStoredToken();
  return true;
});
