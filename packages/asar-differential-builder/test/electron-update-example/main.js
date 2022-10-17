const { app, ipcMain, BrowserWindow } = require('electron');
const { pm } = require("./promises.js")

app.commandLine.appendSwitch("disable-gpu");

let win;

pm.emplace("ready")

ipcMain.handle("waitForReady", async () => {
  await pm.waitFor("ready");
  createDefaultWindow(true);
})

process.on('uncaughtException', function (error) {
  console.log("Electron main process uncaughtException", error);
  pm.rejectAll(error)
})

process.on('unhandledRejection', function (error) {
  console.log("Electron main process unhandledRejection", error);
  pm.rejectAll(error)
})

function createDefaultWindow(e2e) {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`file://${__dirname}/version.html?version=${app.getVersion()}${e2e ? "&e2e=true" : ""}`);
  return win;
}

app.on('ready', async function () {
  pm.resolve("ready", null)
  setTimeout(() => {
    if (!win) {
      createDefaultWindow(false);
    }
  }, 300)
});

require("./real-main.js");