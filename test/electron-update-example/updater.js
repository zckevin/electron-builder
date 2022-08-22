const { AsarUpdater } = require("electron-updater");

const options = {
  provider: "generic",
  channel: "asar",
  url: "http://localhost:10087/"
}

async function checkForUpdates(asarTestingOptions) {
  const updater = new AsarUpdater(options);
  updater.asarTestingOptions = asarTestingOptions;
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

module.exports = {
  checkForUpdates,
}