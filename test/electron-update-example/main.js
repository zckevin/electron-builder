const { app, BrowserWindow, ipcMain } = require('electron');

const { goHttpServer } = require("./binary.js")
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
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('quit', () => {
  goHttpServer.kill("SIGKILL");
});

ipcMain.handle("hello-world", async () => {
  deferExit();
  return 1;
})

ipcMain.handle("checkForUpdates", async (event, updaterTestOptions) => {
  await onReadyPromise;
  deferExit();

  try {
    return await checkForUpdates(updaterTestOptions);
  } catch (err) {
    return err;
  }
});