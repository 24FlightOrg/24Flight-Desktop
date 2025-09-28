import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win; // declare globally

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      devTools: true, // enable while debugging
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setTitle('24System');

  win.webContents.setWindowOpenHandler(({ url }) => {
    const newWin = new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, 'build/icon.ico'),
      webPreferences: {
        devTools: false,
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    newWin.loadURL(url);
    return { action: 'deny' };
  });

  const indexPath = pathToFileURL(path.join(__dirname, 'src/index.html')).toString();
  win.loadURL(indexPath);
});

ipcMain.on('close-app', () => {
  app.quit();
});
