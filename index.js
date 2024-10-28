const { app, BrowserWindow } = require('electron')
const path = require('path')
const Store = require('electron-store')

if (require('electron-squirrel-startup')) return app.quit();
Store.initRenderer()

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1800,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })

    win.loadFile('index.html')
    //win.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
