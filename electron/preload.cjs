const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (_e, status) => cb(status)),
});
