const { app, ipcMain, BrowserWindow } = require('electron');
const { pm } = require("./promises.js")

app.commandLine.appendSwitch("disable-gpu");

let win;

pm.emplace("ready")

ipcMain.handle("waitForReady", async () => {
  const result = await pm.waitFor("ready");
  return result;
})

process.on('uncaughtException', function (error) {
  console.log("Electron main process uncaughtException", error);
  pm.rejectAll(error)
})

process.on('unhandledRejection', function (error) {
  console.log("Electron main process unhandledRejection", error);
  pm.rejectAll(error)
})

function createDefaultWindow() {
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
  win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  return win;
}

// make sure jest is done before exiting
function deferExit() {
  setTimeout(() => app.quit(), 5000);
}

app.on('ready', async function () {
  createDefaultWindow();
  pm.resolve("ready", null)
  deferExit();
});

require("./real-main.js");