import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // Vite sets this when running dev
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // Production build
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
