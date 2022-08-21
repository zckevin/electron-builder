const { tuneUpdaterForTest, doDownloadUpdate, checkForUpdates, } = require("../dist/electron-updater/helper.js");
const { OLD_FILE } = require("../dist/electron-updater/globals.js");
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
    updater.asarTestingOptions.getCachedZipFile = () => {
      return OLD_FILE.zipPath();
    }

    // remove pending zip file before downloading
    updater.asarTestingOptions.removePendingZip = true;
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
    updater.asarTestingOptions.removePendingZip = true;

    // manually enable testing fallback
    updater.asarTestingOptions.throwOnFallback = false;
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
