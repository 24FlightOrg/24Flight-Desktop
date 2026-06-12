const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAuth', {
  openLogin: () => ipcRenderer.invoke('open-login'),
  onAuth: (cb) => ipcRenderer.on('auth-token', (_, token) => cb(token)),
});

contextBridge.exposeInMainWorld('userData', {
  username: () => ipcRenderer.invoke('get-username'),
  globalname: () => ipcRenderer.invoke('get-globalname'),
  getloginstatus: () => ipcRenderer.invoke('get-login'),
  appVersion: () => ipcRenderer.invoke('get-app-version')
});

contextBridge.exposeInMainWorld('userControl', {
  logout: () => ipcRenderer.invoke('logout'),
});

contextBridge.exposeInMainWorld('windowControl', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  openAircraft: (callsign) => ipcRenderer.invoke('open-aircraft-window', callsign),
});

contextBridge.exposeInMainWorld('autopilot', {
  sendRoute: (route) => ipcRenderer.send('autopilot-route', route),
  onAck: (cb) => ipcRenderer.on('autopilot-ack', (_, data) => cb(data)),
  onYokeUpdate: (cb) => ipcRenderer.on('autopilot-yoke-update', (_, data) => cb(data)),
  stop: () => ipcRenderer.invoke('autopilot-stop'),
});

contextBridge.exposeInMainWorld('mapBridge', {
  sendAircraftData: (data) => ipcRenderer.send('aircraft-data', data),
  sendFlightPlans: (plans) => ipcRenderer.send('flightplans-data', plans),
  onAircraftData: (cb) => ipcRenderer.on('aircraft-data', (_, data) => cb(data)),
  onFlightPlans: (cb) => ipcRenderer.on('flightplans-data', (_, data) => cb(data)),
});

contextBridge.exposeInMainWorld('24data', {
  onUpdate: (cb) => ipcRenderer.on('main-ws-update', (_, data) => cb(data)),
  onMessage: (cb) => ipcRenderer.on('main-ws-message', (_, data) => cb(data)),
  send: (data) => ipcRenderer.send('ws-send', data),
  getStatus: () => ipcRenderer.invoke('get-ws-status')
});

contextBridge.exposeInMainWorld('discordRPC', {
  updateActivity: (state) => ipcRenderer.invoke('update-discord-activity', state),
});