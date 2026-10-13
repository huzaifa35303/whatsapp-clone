const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  showNotification: (data) => ipcRenderer.invoke('show-notification', data)
});
