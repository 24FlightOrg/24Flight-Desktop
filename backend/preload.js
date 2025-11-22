// preload.js (CommonJS)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAuth', {
  openLogin: () => ipcRenderer.invoke('open-login'),
  onAuth: (cb) => ipcRenderer.on('auth-token', (_, token) => cb(token)),
});

contextBridge.exposeInMainWorld('userData', {
  username: () => ipcRenderer.invoke('get-username'),
});