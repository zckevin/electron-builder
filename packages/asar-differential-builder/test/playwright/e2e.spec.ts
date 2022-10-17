import { expect, test } from '@playwright/test'
import { ElectronApplication } from 'playwright'
import { ipcMainInvokeHandler } from 'electron-playwright-helpers'
import * as http from 'http'
const fsExtra = require('fs-extra')
const path = require('path')
const { isCi } = require("env-ci")();

import { DIST_DIR, getAppInfo } from "../global"
import { spawnExecutable } from "./helper"
import { generateProjectForE2e } from "./helper"
const { createStaticServer } = require("./http-server.js");
import { randomDirName } from "../units/helper";

let server: http.Server;
let electronApp: ElectronApplication
const TEST_ROOT = path.join(DIST_DIR, randomDirName("e2e"));
const TEST_VERSIONS = ["0.0.1", "0.0.2"]

test.beforeAll(async () => {
  fsExtra.ensureDirSync(TEST_ROOT)
  fsExtra.emptyDirSync(TEST_ROOT)
  server = await createStaticServer(TEST_ROOT);
})

test.afterAll(async () => {
  server?.close();
})

test.beforeEach(async () => {
  fsExtra.ensureDirSync(TEST_ROOT)
  fsExtra.emptyDirSync(TEST_ROOT)
})

interface TestOptions {
  differencialUpdate: boolean;
  isDowngrade: boolean;
  asar: boolean;
  useJpegChannel: boolean;
}

async function testUpdate(versions: string[], options: TestOptions) {
  // generate & build the electron projects
  if ((isCi || process.env.FAKE_CI) && options.asar) {
    console.log("env isCi == true")
    const preGeneratedDestDir = path.join(DIST_DIR, `ci_pregenerated_projects`)
    if (!fsExtra.existsSync(preGeneratedDestDir)) {
      throw new Error(`preGeneratedDestDirForCi: dir not found: ${preGeneratedDestDir}`)
    }
    fsExtra.emptyDirSync(TEST_ROOT)
    fsExtra.copySync(preGeneratedDestDir, TEST_ROOT)
    console.log(`preGeneratedDestDirForCi: use copy from ${preGeneratedDestDir} to ${TEST_ROOT}`)
  } else {
    await generateProjectForE2e(
      versions,
      TEST_ROOT,
      options.asar,
      options.useJpegChannel,
    );
  }

  const appInfo = getAppInfo(TEST_ROOT, versions[0])
  const asarUpdaterConfig = {
    includesBinaryDir: true,
    allowDowngrade: true,
    autoDownload: true,
  }

  {
    electronApp = await spawnExecutable(appInfo)
    let testingOptions: any = {
      throwOnFallback: options.differencialUpdate ? true : false,
      ignoreRealZipBackup: true,
      removePendingZip: true,
      ignoreRealInstall: false, // do install
    }
    if (options.differencialUpdate) {
      testingOptions.cachedZipFilePath = path.join(
        TEST_ROOT,
        `electron-update-example-${versions[0]}${appInfo.asarZipSuffix}.asar.zip`
      );
    }
    ipcMainInvokeHandler(electronApp, "createAsarUpdater", testingOptions, asarUpdaterConfig);
    if (options.isDowngrade) {
      const updateInfo: any = await ipcMainInvokeHandler(electronApp, "checkForUpdates");
      const targetUrl = updateInfo.files.find((f: any) => f.url.includes(versions[1])).url;
      expect(await ipcMainInvokeHandler(electronApp, "downloadUpdate", targetUrl))
        .toStrictEqual(["update-downloaded"]);
    } else {
      expect(await ipcMainInvokeHandler(electronApp, "checkForUpdatesAndNotify"))
        .toStrictEqual(["update-available", "update-downloaded"])
    }
    expect(await ipcMainInvokeHandler(electronApp, "getVersionGolang"))
      .toContain(versions[0])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionJavascript"))
      .toStrictEqual(versions[0])
    expect(await ipcMainInvokeHandler(electronApp, "quit"))
      .toBeTruthy()
    await electronApp?.waitForEvent("close")
  }

  // TODO: maybe we should add an event to signal the update is complete?
  // sleep for 1 second to make sure the app is updated
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log("=================================================================")
  console.log(`updgraded from ${versions[0]} to ${versions[1]}!`)
  console.log("=================================================================")

  {
    electronApp = await spawnExecutable(appInfo)
    const testingOptions = {
      throwOnFallback: true,
      ignoreRealZipBackup: true,
      removePendingZip: true,
      ignoreRealInstall: true,
    }
    if (!options.isDowngrade) {
      ipcMainInvokeHandler(electronApp, "createAsarUpdater", testingOptions, asarUpdaterConfig);
      expect(await ipcMainInvokeHandler(electronApp, "checkForUpdatesAndNotify"))
        .toStrictEqual(["update-not-available"])
    }
    expect(await ipcMainInvokeHandler(electronApp, "getVersionGolang"))
      .toContain(versions[1])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionJavascript"))
      .toStrictEqual(versions[1])
    expect(await ipcMainInvokeHandler(electronApp, "quit"))
      .toBeTruthy()
    await electronApp?.waitForEvent("close")
  }

  // wait for electron.exe to exit fully on windows
  if (process.platform === 'win32') {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

test('Electron-update-example should be upgraded by falling back to full download update', async () => {
  await testUpdate(TEST_VERSIONS, {
    differencialUpdate: false, // ***
    isDowngrade: false,
    asar: true,
    useJpegChannel: false,
  })
})

test('Electron-update-example should be upgraded using differencial update', async () => {
  await testUpdate(TEST_VERSIONS, {
    differencialUpdate: true, // ***
    isDowngrade: false,
    asar: true,
    useJpegChannel: false,
  })
})

test('Electron-update-example could be upgraded with asar disabled', async () => {
  await testUpdate(TEST_VERSIONS, {
    differencialUpdate: true,
    isDowngrade: false,
    asar: false, // ***
    useJpegChannel: false,
  })
})

test('Electron-update-example could be downgraded', async () => {
  const versions = TEST_VERSIONS.slice().reverse() // ***
  await testUpdate(versions, {
    differencialUpdate: false,
    isDowngrade: true, // ***
    asar: true,
    useJpegChannel: false,
  })
})

test('Electron-update-example could be upgraded with jpeg channel', async () => {
  await testUpdate(TEST_VERSIONS, {
    differencialUpdate: true,
    isDowngrade: false,
    asar: true,
    useJpegChannel: true, // ***
  })
})
