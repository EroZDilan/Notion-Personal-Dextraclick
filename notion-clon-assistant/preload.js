const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('assistant', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  checkBackend: () => ipcRenderer.invoke('check-backend'),
  hideWindow: () => ipcRenderer.send('hide-window')
})
