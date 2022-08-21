const { _electron: electron } = require('playwright');
const path = require('path');
const { createStaticServer } = require("./http-server.js");
const { FIXTURES_DIR, NEW_FILE } = require("../out/units/electron-updater/config.js");
const { ipcMainInvokeHandler } = require("electron-playwright-helpers")

const defaultTimeout = 15 * 1000; // 15 seconds
const mainJsPath = path.join(__dirname, "main.js");

let server;

beforeAll(async () => {
  server = await createStaticServer(FIXTURES_DIR);
});

afterAll(async () => {
  server.close();
});

test("Differencial download should success", async () => {
  const electronApp = await electron.launch({ args: [mainJsPath] });
  await ipcMainInvokeHandler(electronApp, 'differencial-download');
  const updateResult = await ipcMainInvokeHandler(electronApp, 'get-update-result');
  expect(updateResult.version).toEqual(NEW_FILE.version);
}, defaultTimeout);

test("Fallback to full download should success", async () => {
  const electronApp = await electron.launch({ args: [mainJsPath] });
  await ipcMainInvokeHandler(electronApp, 'fallback-to-full-download');
  const updateResult = await ipcMainInvokeHandler(electronApp, 'get-update-result');
  expect(updateResult.version).toEqual(NEW_FILE.version);
}, defaultTimeout);
