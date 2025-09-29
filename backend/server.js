import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fetch from "node-fetch";
import Store from "electron-store";
const store = new Store();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icon.ico'),
    frame: false, // disables the default OS title bar
    titleBarStyle: "hidden",
    webPreferences: {
      devTools: false,
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
      frame: false, // disables the default OS title bar
      titleBarStyle: "hidden",
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

ipcMain.on("window-control", (event, action) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  switch (action) {
    case "minimize":
      win.minimize();
      break;
    case "maximize":
      win.isMaximized() ? win.unmaximize() : win.maximize();
      break;
    case "close":
      win.close();
      break;
  }
});

ipcMain.handle("login-discord", async () => {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      webPreferences: {
        nodeIntegration: false,
      },
    });

    const clientId = "1402033275425259581";
    const clientSecret = "v-E4tS4TqHnr32wRJMQ9pZR8_O7UdORT";
    const redirectUri = "http://localhost:3000/auth/discord/callback";
    const authUrl =
      `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=identify%20email`;

    authWindow.loadURL(authUrl);

    function handleCallback(url) {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get("code");
      const error = urlObj.searchParams.get("error");

      if (code) {
        authWindow.destroy();

        fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
          }),
        })
          .then(res => res.json())
          .then(data => {
            resolve(data);
          })
          .catch(err => reject(err));
      } else if (error) {
        reject(error);
        authWindow.destroy();
      }
    }

    authWindow.webContents.on("will-redirect", (event, url) => {
      if (url.startsWith(redirectUri)) {
        event.preventDefault();
        handleCallback(url);
      }
    });
  });
});

ipcMain.on('close-app', () => {
  app.quit();
});
