import { expect, test } from '@playwright/test'
import { ElectronApplication } from 'playwright'
import { ipcMainInvokeHandler } from 'electron-playwright-helpers'
import { DIST_DIR } from "../global"
import { generateTestingProjects, spawnExecutable } from "./helper"
import * as http from 'http'
const fsExtra = require('fs-extra')
const path = require('path')
const { createStaticServer } = require("../e2e/http-server.js");

let server: http.Server;
let electronApp: ElectronApplication

test.beforeAll(async () => {
  server = await createStaticServer(DIST_DIR);
})

test.afterAll(async () => {
  server.close();
})

test.beforeEach(async () => {
  fsExtra.ensureDirSync(DIST_DIR)
  fsExtra.emptyDirSync(DIST_DIR)
})

test.afterEach(async () => {
  await electronApp.close()
})

async function testUpdate(differencialUpdate: boolean) {
  const versions = ["0.0.1", "0.0.2"]
  await generateTestingProjects(versions)

  {
    electronApp = await spawnExecutable(versions[0])
    let asarTestingOptions: any = {
      throwOnFallback: differencialUpdate ? true : false,
      ignoreRealZipBackup: true,
      ignoreRealInstall: false, // do install
    }
    if (differencialUpdate) {
      asarTestingOptions.cachedZipFilePath =
        path.join(DIST_DIR, `electron-update-example-${versions[0]}.asar.zip`)
    }
    expect(await ipcMainInvokeHandler(electronApp, "checkForUpdates", asarTestingOptions))
      .toStrictEqual(["update-available", "update-downloaded"])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionGolang"))
      .toContain(versions[0])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionJavascript"))
      .toStrictEqual(versions[0])
    expect(await ipcMainInvokeHandler(electronApp, "quit"))
      .toBeTruthy()
    
    console.log("=================================================================")
    console.log(`updgraded from ${versions[0]} to ${versions[1]}!`)
    console.log("=================================================================")
  }

  {
    electronApp = await spawnExecutable(versions[0])
    const asarTestingOptions = {
      throwOnFallback: true,
      ignoreRealZipBackup: true,
      ignoreRealInstall: true,
    }
    expect(await ipcMainInvokeHandler(electronApp, "checkForUpdates", asarTestingOptions))
      .toStrictEqual(["update-not-available"])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionGolang"))
      .toContain(versions[1])
    expect(await ipcMainInvokeHandler(electronApp, "getVersionJavascript"))
      .toStrictEqual(versions[1])
    expect(await ipcMainInvokeHandler(electronApp, "quit"))
      .toBeTruthy()
  }
}

test('Electron-update-example should be upgraded by falling back to full download update', async () => {
  await testUpdate(false)
})

test('Electron-update-example should be upgraded using differencial update', async () => {
  await testUpdate(true)
})
