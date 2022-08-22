const { app, ipcMain } = require('electron');
const { goHttpServer, goHttpServerGetVersion } = require("./binary.js")
const { checkForUpdates } = require("./updater.js")
const { pm } = require("./promises.js")

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

ipcMain.handle("checkForUpdates", async (event, testingOptions, config) => {
  try {
    return await pm.wrap(checkForUpdates(testingOptions, config))
  } catch (err) {
    return err;
  }
});

ipcMain.handle("getVersionGolang", async (event) => {
  try {
    return await pm.wrap(goHttpServerGetVersion())
  } catch (err) {
    return err;
  }
});

ipcMain.handle("getVersionJavascript", async (event) => {
  try {
    return require("./version.js").version;
  } catch (err) {
    return err;
  }
});
