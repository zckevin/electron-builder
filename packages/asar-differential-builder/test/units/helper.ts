import { OLD_FILE, NEW_FILE, FIXTURES_DIR, YML_DUMMY_URL } from "../global"
import { ElectronBuilderConfig } from "../electron-builder-config"
import { BuilderConfig } from '../../src/config';

import { AsarUpdater } from "electron-updater";
import { GenericProvider } from "electron-updater/out/providers/GenericProvider";
import { parseUpdateInfo } from "electron-updater/out/providers/Provider";
import { CancellationToken } from "builder-util-runtime";
import { BlockMap } from "builder-util-runtime"
import { gunzipSync } from "zlib"
const fs = require("fs");
const path = require("path");
const fsExtra = require('fs-extra');

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

export function createBuildTargetDir(testRootDir: string, prefix: string = '') {
  const dir = path.join(testRootDir, randomDirName(`${process.platform}_${prefix}`))
  fsExtra.ensureDirSync(dir)
  fsExtra.emptyDirSync(dir)
  return dir
}

export function randomDirName(prefix: string = '') {
  return prefix + '-' + [...Array(8)].map(() => Math.random().toString(36)[2]).join('')
}

export function readFilesInDir(dir: string) {
  const files: Array<string> = fs.readdirSync(dir, { withFileTypes: true })
    .filter((item: any) => !item.isDirectory())
    .map((item: any) => item.name);
  return files;
}

export function getFilePathByRegex(dir: string, regex: RegExp) {
  const files = readFilesInDir(dir);
  const ymlFileName = files.find((file: string) => regex.test(file));
  if (!ymlFileName) {
    throw new Error(`Cannot find file in ${dir} by regex ${regex}`)
  }
  return path.join(dir, ymlFileName);
}

export function getDifferencialBuilderConfig(targetDir: string, appRoot: string, unitTestConfig: UnitTestConfig) {
  const differencialBuilderConfig = new BuilderConfig(targetDir);
  differencialBuilderConfig.useJpegChannel = false; 
  differencialBuilderConfig.testingOptions.backupUnpackedAppRoot = false;
  const electronBuilderConfig =
    new ElectronBuilderConfig(appRoot)
      .withOutputDir(differencialBuilderConfig.targetDir)
      .withDifferentialBuilderConfig(differencialBuilderConfig)
      .withBinaryDir(unitTestConfig.includesBinaryDir)
      .withAsar(unitTestConfig.asar)

  return {
    differencialBuilderConfig,
    electronBuilderConfig
  }
}

export interface UnitTestConfig {
  includesBinaryDir: boolean;
  asar: boolean;
}
