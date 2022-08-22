const { app, BrowserWindow, ipcMain } = require('electron');
const { goHttpServer, goHttpServerGetVersion } = require("./binary.js")
const { checkForUpdates } = require("./updater.js")

app.commandLine.appendSwitch("disable-gpu");

let win;
let onReadyPromiseResolve;
let onReadyPromise = new Promise(resolve => {
  onReadyPromiseResolve = resolve;
});

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
  onReadyPromiseResolve();
  deferExit();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  goHttpServer.kill("SIGKILL");
});

ipcMain.handle("quit", async () => {
  app.quit();
  return true;
});

ipcMain.handle("hello-world", async () => {
  deferExit();
  return 1;
})

ipcMain.handle("checkForUpdates", async (event, updaterTestOptions) => {
  await onReadyPromise;
  try {
    return await checkForUpdates(updaterTestOptions);
  } catch (err) {
    return err;
  }
});

ipcMain.handle("getVersionGolang", async (event) => {
  await onReadyPromise;
  try {
    return await goHttpServerGetVersion();
  } catch (err) {
    return err;
  }
});

ipcMain.handle("getVersionJavascript", async (event) => {
  await onReadyPromise;
  try {
    return require("./version.js").version;
  } catch (err) {
    return err;
  }
});