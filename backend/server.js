import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      devTools: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setTitle('24Flight');

  const indexPath = pathToFileURL(path.join(__dirname, 'src/index.html')).toString();
  win.loadURL(indexPath);
});

ipcMain.handle('open-login', async () => {
  return new Promise((resolve, reject) => {
    if (!win) return reject(new Error('Main window not available'));

    const oauthWindow = new BrowserWindow({
      width: win.getBounds().width - 100,
      height: win.getBounds().height - 100,
      modal: true,
      parent: win,
      show: true,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const loginUrl = 'https://24flight.org/oauth/login';
    oauthWindow.loadURL(loginUrl);

    const { webContents } = oauthWindow;

    let finished = false;

    const handleToken = (token) => {
      if (finished) return;
      finished = true;
      win.webContents.send('auth-token', token);
      resolve(token);
      if (!oauthWindow.isDestroyed()) oauthWindow.close();
    };

    const filter = { urls: ['*://24flight.org/oauth/desktop/callback*'] };
    webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
      try {
        const parsed = new URL(details.url);
        const token = parsed.searchParams.get('token');

        if (token) handleToken(token);
      } catch (err) {
        console.error('Error parsing OAuth callback URL:', err);
      }

      callback({ cancel: false });
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
