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

test('Updater should emit `update-not-available` when no updates available', async () => {
  await generateTestingProjects(["0.0.1"])
  electronApp = await spawnExecutable()

  const asarTestingOptions = {
    throwOnFallback: true,
    ignoreRealInstall: true,
    ignoreRealZipBackup: true,
  }
  const result = await ipcMainInvokeHandler(electronApp, "checkForUpdates", asarTestingOptions);
  expect(result).toStrictEqual(["update-not-available"])
})

test("Full download should success", async () => {
  await generateTestingProjects(["0.0.1", "0.0.2"])
  electronApp = await spawnExecutable()

  const asarTestingOptions = {
    throwOnFallback: false,
    ignoreRealInstall: true,
    ignoreRealZipBackup: true,
  }
  const result = await ipcMainInvokeHandler(electronApp, "checkForUpdates", asarTestingOptions);
  expect(result).toStrictEqual(["update-available", "update-downloaded"])
})

test("Differencial download should success", async () => {
  await generateTestingProjects(["0.0.1", "0.0.2"])
  electronApp = await spawnExecutable()

  const asarTestingOptions = {
    throwOnFallback: true,
    ignoreRealInstall: true,
    ignoreRealZipBackup: true,
    removePendingZip: true,
    cachedZipFilePath: path.join(DIST_DIR, "electron-update-example-0.0.1.asar.zip"),
  }
  const result = await ipcMainInvokeHandler(electronApp, "checkForUpdates", asarTestingOptions);
  expect(result).toStrictEqual(["update-available", "update-downloaded"])
})
