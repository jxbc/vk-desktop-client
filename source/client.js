const { app, BrowserWindow, Notification, protocol, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

app.disableHardwareAcceleration()

const createWindow = () => {
  const win = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 680,
    minHeight: 560,
    frame: false,
    maximizable: true,
    resizable: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "side.js")
    },
    icon: path.join(__dirname, 'vk.ico'),
    titleBarStyle: 'hidden',
      //titleBarOverlay: {
      //color: '#0b1014',
      //symbolColor: '#0ba0be',
      //height: 20
    //}
  })
  win.webContents.setFrameRate(90)
  win.loadFile('gui/start.html')

  ipcMain.on("action", (event, args) => {
    if(args == 'close') {
      app.quit()
    }
    if(args == 'hide') {
      win.minimize()
    }
    if(args == 'max') {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
    if(args.type == 'minmax') {
      new Notification({
        title: 'С возвращением!',
        body: `Вы снова здесь!`,
        icon: path.join(__dirname, 'vk.ico')
      }).show();
    }
    if(args.type == 'min') {
      new Notification({
        title: 'VK Desktop в фоне',
        body: `Приложение продолжает свою работу в фоне`,
        icon: path.join(__dirname, 'vk.ico')
      }).show();
    }
  })

  ipcMain.on("render", (event, args) => {
    if(args == 'template') {
      win.loadFile('gui/template.html')
      //win.setContentProtection(1)
    }
  })

}

app.setAppUserModelId('VK Desktop Client');

app.whenReady().then(() => {
  protocol.handle('vkclient', (request) => {
    net.fetch('file://' + request.url.slice('vkclient://'.length))
  })
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})