const { differencialDownload, fallbackToFullDownload } = require("./updater.js");
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");

app.commandLine.appendSwitch("disable-gpu");

let win;
let onReadyPromiseResolve;
let onReadyPromise = new Promise(resolve => {
  onReadyPromiseResolve = resolve;
});
let updateResultPromise;

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
  win.loadURL(`file://${path.join(__dirname, "../")}/version.html#v${app.getVersion()}`);
  return win;
}

// make sure jest is done before exiting
function deferExit() {
  setTimeout(() => app.quit(), 2000);
}

app.on('ready', async function () {
  createDefaultWindow();
  onReadyPromiseResolve();
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle("differencial-download", async () => {
  await onReadyPromise;
  updateResultPromise = differencialDownload();
});

ipcMain.handle("fallback-to-full-download", async () => {
  await onReadyPromise;
  updateResultPromise = fallbackToFullDownload();
});

ipcMain.handle("get-update-result", async () => {
  deferExit();
  try {
    const result = await updateResultPromise;
    return result;
  } catch (err) {
    return err;
  }
})