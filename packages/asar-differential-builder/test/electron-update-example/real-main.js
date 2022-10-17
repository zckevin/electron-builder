const { app, ipcMain } = require('electron');
const { AsarUpdater } = require("electron-updater");
const { goHttpServer, goHttpServerGetVersion } = require("./binary.js")
const { pm } = require("./promises.js")

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  goHttpServer.kill("SIGKILL");
});

const publishOptions = {
  provider: "generic",
  channel: "asar",
  url: "http://192.168.123.19:10087/",
}

let updater;

ipcMain.handle("createAsarUpdater", async (event, testingOptions, config) => {
  if (!updater) {
    updater = new AsarUpdater(config, testingOptions, publishOptions);
  }
});

ipcMain.handle("checkForUpdates", async (event) => {
  try {
    return (await pm.wrap(updater.checkForUpdates()))?.updateInfo
  } catch (err) {
    return err;
  }
});

ipcMain.handle("checkForUpdatesAndNotify", async (event) => {
  try {
    return await pm.wrap(checkForUpdatesAndNotify())
  } catch (err) {
    return err;
  }
});

ipcMain.handle("downloadUpdate", async (event, targetUrl) => {
  try {
    return await pm.wrap(downloadUpdate(targetUrl))
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

ipcMain.handle("quit", async () => {
  try {
    await pm.wrap(killGolangHTTPServer())
    app.quit();
    return true;
  } catch (err) {
    return err;
  }
});

ipcMain.handle('relaunch', async () => {
  await pm.wrap(killGolangHTTPServer())
  app.relaunch();
  app.exit();
})

async function checkForUpdatesAndNotify() {
  updater.checkForUpdatesAndNotify();

  return new Promise((resolve) => {
    const events = []
    updater.on("update-available", () => {
      events.push("update-available")
    });
    updater.on("err", (err) => {
      events.push(err)
      resolve(events);
    });
    updater.on("update-not-available", () => {
      events.push("update-not-available");
      resolve(events);
    });
    updater.on("update-downloaded", (info) => {
      events.push("update-downloaded");
      resolve(events);
    })
  })
}

async function downloadUpdate(targetUrl) {
  updater.downloadUpdate(undefined /* CancellationToken */, targetUrl);

  return new Promise((resolve) => {
    const events = []
    updater.on("err", (err) => {
      events.push(err)
      resolve(events);
    });
    updater.on("update-downloaded", (info) => {
      events.push("update-downloaded");
      resolve(events);
    })
  })
}

async function killGolangHTTPServer() {
  goHttpServer.kill("SIGKILL");
  return new Promise((resolve) => {
    goHttpServer.on("close", () => {
      resolve();
    })
  })
}