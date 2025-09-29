import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld("auth", {
  login: () => ipcRenderer.invoke("login-discord"),
});

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("min-btn").addEventListener("click", () => {
    ipcRenderer.send("window-control", "minimize");
  });

  document.getElementById("max-btn").addEventListener("click", () => {
    ipcRenderer.send("window-control", "maximize");
  });

  document.getElementById("close-btn").addEventListener("click", () => {
    ipcRenderer.send("window-control", "close");
  });
});