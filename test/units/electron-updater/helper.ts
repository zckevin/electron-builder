import { OLD_FILE, NEW_FILE, FIXTURES_DIR, YML_DUMMY_URL } from "../../global"
import { AsarUpdater } from "electron-updater";
import { GenericProvider } from "electron-updater/out/providers/GenericProvider";
import { parseUpdateInfo } from "electron-updater/out/providers/Provider";
import { CancellationToken } from "builder-util-runtime";
import { BlockMap } from "builder-util-runtime"
import { gunzipSync } from "zlib"
const fs = require("fs");
const path = require("path");

function readBlockmapFromFixtures(url: URL): BlockMap {
  let f;
  if (url.pathname.includes(OLD_FILE.version)) {
    f = OLD_FILE;
  } else if (url.pathname.includes(NEW_FILE.version)) {
    f = NEW_FILE;
  } else {
    throw new Error("Unknown version");
  }
  const data = fs.readFileSync(f.blockmapPath());
  try {
    return JSON.parse(gunzipSync(data).toString())
  } catch (e) {
    throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`)
  }
}

async function mockDownloadBlockMap(url: URL): Promise<BlockMap> {
  return readBlockmapFromFixtures(url);
}

export function tuneUpdaterForTest(updater: AsarUpdater) {
  updater.updateConfigPath = path.join(FIXTURES_DIR, "app-update.yml");
  updater.downloadBlockMap = mockDownloadBlockMap;

  updater.testingOptions = {
    throwOnFallback: true,
    ignoreRealInstall: true,
    ignoreRealZipBackup: true,
  }
}

export async function doDownloadUpdate(updater: AsarUpdater, ymlURL: URL = YML_DUMMY_URL) {
  const ymlString = fs.readFileSync(NEW_FILE.ymlPath(), "utf8");
  const updateInfo = parseUpdateInfo(ymlString, "asar.yml", YML_DUMMY_URL);
  console.log("updateInfo:", updateInfo);

  const downloadUpdateOptions = {
    updateInfoAndProvider: {
      info: updateInfo,
      provider: new GenericProvider({
        provider: "generic",
        url: ymlURL.href,
        channel: "latest",
      }, updater, {
        isUseMultipleRangeRequest: false,
      } as any),
    },
    requestHeaders: {},
    cancellationToken: new CancellationToken(),
    disableWebInstaller: false,
  }
  await updater.doDownloadUpdate(downloadUpdateOptions);
}

export async function checkForUpdates(updater: AsarUpdater) {
  await updater.checkForUpdatesAndNotify();
}