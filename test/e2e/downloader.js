const { tuneUpdaterForTest, doDownloadUpdate } = require("../out/units/electron-updater/helper.js");
const { OLD_FILE } = require("../out/units/electron-updater/config.js");
const { serverPort } = require("./http-server.js");
const { AsarUpdater } = require("electron-updater");
const log = require('electron-log');

const options = {
  provider: 'generic',
  url: 'https://example.com/auto-updates'
}
const ymlURL = new URL(`http://localhost:${serverPort}`);

async function differencialDownload() {
  const updater = new AsarUpdater(options)
  updater.logger = log;

  {
    tuneUpdaterForTest(updater);

    // manually set the current version for AsarUpdater
    updater.appVersion = OLD_FILE.version;

    // manually set cache zip file path
    updater.testingOptions.getCachedZipFile = () => {
      return OLD_FILE.zipPath();
    }

    // remove pending zip file before downloading
    updater.testingOptions.removePendingZip = true;
  }

  doDownloadUpdate(updater, ymlURL);

  return new Promise((resolve, reject) => {
    updater.on('update-downloaded', (info) => {
      resolve(info);
    }).on('error', (err) => {
      reject(err);
    });
  })
}

async function fallbackToFullDownload() {
  const updater = new AsarUpdater(options)
  updater.logger = log;

  {
    tuneUpdaterForTest(updater);

    // manually set the current version for AsarUpdater
    updater.appVersion = OLD_FILE.version;

    // remove pending zip file before downloading
    updater.testingOptions.removePendingZip = true;

    // manually enable testing fallback
    updater.testingOptions.throwOnFallback = false;
  }

  doDownloadUpdate(updater, ymlURL);

  return new Promise((resolve, reject) => {
    updater.on('update-downloaded', (info) => {
      resolve(info);
    }).on('error', (err) => {
      reject(err);
    });
  })
}

module.exports = {
  differencialDownload,
  fallbackToFullDownload,
}
