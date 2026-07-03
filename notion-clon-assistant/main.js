const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const http = require('http')

let tray = null
let chatWindow = null
let backendOnline = false

const BACKEND_URL = 'http://localhost:5162'
const CHECK_INTERVAL = 5000

function checkBackend() {
  http.get(`${BACKEND_URL}/api/paginas`, (res) => {
    backendOnline = res.statusCode !== 0
  }).on('error', () => {
    backendOnline = false
  })
}

function createChatWindow() {
  const { screen } = require('electron')
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  chatWindow = new BrowserWindow({
    width: 380,
    height: 560,
    x: sw - 400,
    y: sh - 600,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  chatWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  chatWindow.on('blur', () => {
    // No auto-cerrar al perder foco para mejor UX
  })

  chatWindow.on('closed', () => {
    chatWindow = null
  })
}

function toggleWindow() {
  if (!chatWindow) {
    createChatWindow()
    chatWindow.show()
    return
  }

  if (chatWindow.isVisible()) {
    chatWindow.hide()
  } else {
    chatWindow.show()
    chatWindow.focus()
  }
}

function createTray() {
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const iconPath = path.join(__dirname, 'assets', iconFile)
  let icon
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) throw new Error('empty')
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('NotionClon Asistente IA')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir asistente',
      click: toggleWindow
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', toggleWindow)
}

app.whenReady().then(() => {
  app.setName('NotionClon Asistente')

  // Ocultar del dock en macOS
  if (process.platform === 'darwin') app.dock?.hide()

  createTray()
  createChatWindow()

  // Comprobar backend periódicamente
  checkBackend()
  setInterval(checkBackend, CHECK_INTERVAL)
})

app.on('window-all-closed', (e) => {
  // No salir al cerrar la ventana — seguir en tray
  e.preventDefault()
})

// IPC para comunicación con el renderer
const { ipcMain } = require('electron')

ipcMain.handle('get-backend-url', () => BACKEND_URL)
ipcMain.handle('check-backend', () => backendOnline)
ipcMain.on('hide-window', () => chatWindow?.hide())
