import { expect, test } from '@playwright/test'
import { ElectronApplication } from 'playwright'
import { ipcMainInvokeHandler } from 'electron-playwright-helpers'
import * as http from 'http'
const fsExtra = require('fs-extra')
const path = require('path')

import { DIST_DIR, getAppInfo } from "../global"
import { generateTestingProjects, spawnExecutable } from "./helper"
const { createStaticServer } = require("./http-server.js");

let server: http.Server;
let electronApp: ElectronApplication
const { isCi } = require("env-ci")();

test.beforeAll(async () => {
  server = await createStaticServer(DIST_DIR);
})

test.afterAll(async () => {
  server?.close();
})

test.beforeEach(async () => {
  fsExtra.ensureDirSync(DIST_DIR)
  fsExtra.emptyDirSync(DIST_DIR)
})

async function testUpdate(differencialUpdate: boolean) {
  const versions = ["0.0.1", "0.0.2"]

  if (isCi) {
    console.log("env isCi == true")
    const preGeneratedDestDir = path.join(DIST_DIR, `../dist2`)
    if (!fsExtra.existsSync(preGeneratedDestDir)) {
      throw new Error(`preGeneratedDestDirForCi: dir not found: ${preGeneratedDestDir}`)
    }
    fsExtra.copySync(preGeneratedDestDir, DIST_DIR)
    console.log(`preGeneratedDestDirForCi: use copy from ${preGeneratedDestDir} to ${DIST_DIR}`)
  } else {
    await generateTestingProjects(versions)
  }

  const appInfo = getAppInfo(versions[0])

  {
    electronApp = await spawnExecutable(appInfo)
    let testingOptions: any = {
      throwOnFallback: differencialUpdate ? true : false,
      ignoreRealZipBackup: true,
      removePendingZip: true,
      ignoreRealInstall: false, // do install
    }
    if (differencialUpdate) {
      testingOptions.cachedZipFilePath =
        path.join(DIST_DIR, `electron-update-example-${versions[0]}.asar.zip`)
    }
    const asarUpdaterConfig = {
      resourcesDir: appInfo.resourcesDir,
    }
    expect(await ipcMainInvokeHandler(electronApp, "checkForUpdates", testingOptions, asarUpdaterConfig))
      .toStrictEqual(["update-available", "update-downloaded"])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionGolang"))
      .toContain(versions[0])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionJavascript"))
      .toStrictEqual(versions[0])
    expect(await ipcMainInvokeHandler(electronApp, "quit"))
      .toBeTruthy()
    await electronApp?.waitForEvent("close")

    console.log("=================================================================")
    console.log(`updgraded from ${versions[0]} to ${versions[1]}!`)
    console.log("=================================================================")
  }

  // TODO: maybe we should add an event to signal the update is complete?
  // sleep for 1 second to make sure the app is updated
  await new Promise(resolve => setTimeout(resolve, 1000))

  {
    electronApp = await spawnExecutable(appInfo)
    const testingOptions = {
      throwOnFallback: true,
      ignoreRealZipBackup: true,
      removePendingZip: true,
      ignoreRealInstall: true,
    }
    expect(await ipcMainInvokeHandler(electronApp, "checkForUpdates", testingOptions))
      .toStrictEqual(["update-not-available"])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionGolang"))
      .toContain(versions[1])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionJavascript"))
      .toStrictEqual(versions[1])
    expect(await ipcMainInvokeHandler(electronApp, "quit"))
      .toBeTruthy()
    await electronApp?.waitForEvent("close")
  }
}

test('Electron-update-example should be upgraded by falling back to full download update', async () => {
  await testUpdate(false)
})

test('Electron-update-example should be upgraded using differencial update', async () => {
  await testUpdate(true)
})
