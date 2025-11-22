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
    const oauthWindow = new BrowserWindow({
      width: win.getBounds().width - 100,
      height: win.getBounds().height - 100,
      modal: true,
      parent: win,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const loginUrl = 'https://24flight.org/oauth/login';
    oauthWindow.loadURL(loginUrl);

    const { webContents } = oauthWindow;

    const handleRedirect = (event, url) => {
      const parsed = new URL(url);

      if (parsed.pathname === '/oauth/desktop/callback') {
        event.preventDefault();
        const token = parsed.searchParams.get('token');

        if (token) {
          win.webContents.send('auth-token', token);
          oauthWindow.close();
        }
      }
    };

    webContents.on('will-redirect', handleRedirect);
    webContents.on('did-navigate', handleRedirect);

    oauthWindow.on('closed', () => {
      reject(new Error('OAuth window closed by user'));
    });
  });
});

ipcMain.on('close-app', () => {
  app.quit();
});
