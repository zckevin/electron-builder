import { AsarUpdater } from "electron-updater";
import { OLD_FILE, PUBLISH_OPTIONS } from "../global";
import { tuneUpdaterForTest, doDownloadUpdate } from "./helper"
import { createHTTPExecutorMock } from "./httpExecutor"
import { createTestAppAdapter } from "./helpers/updaterTestUtil"

var updater: AsarUpdater;
var updaterEventHandlers: any;

jest.setTimeout(60 * 1000);

beforeEach(async () => {
  jest.clearAllMocks();

  updater = new AsarUpdater(undefined, undefined, PUBLISH_OPTIONS as any, await createTestAppAdapter(OLD_FILE.version));
  updaterEventHandlers = {
    onUpdateDownloaded: jest.fn(),
  }
  // @ts-ignore
  updater.on("update-downloaded", updaterEventHandlers.onUpdateDownloaded);
})

test("Should fallback to full download if `oldFile`(cached zip) does not exists", async () => {
  tuneUpdaterForTest(updater);
  await expect(doDownloadUpdate(updater)).rejects.toThrowError(/no such file or directory.*current\.asar\.zip/);
})

test("Full download fallback should call httpExecutor.download()", async () => {
  tuneUpdaterForTest(updater);

  // for updater to fallback to full download
  updater.testingOptions!.throwOnFallback = false;
  updater.httpExecutor = createHTTPExecutorMock();

  try {
    await doDownloadUpdate(updater);
  } catch (e) {
    throw e;
  }

  expect(updater.httpExecutor.download).toBeCalled();
})

test("Differencial download should succeed with existing/specified `oldfile`", async () => {
  tuneUpdaterForTest(updater);

  // set oldfile path
  updater.testingOptions!.cachedZipFilePath = OLD_FILE.zipPath();
  updater.httpExecutor = createHTTPExecutorMock();

  try {
    await doDownloadUpdate(updater);
  } catch (e) {
    throw e;
  }

  expect(updaterEventHandlers.onUpdateDownloaded).toBeCalled();
})

test("Differencial download should fallback to full download if current oldfile is corrupted", async () => {
  tuneUpdaterForTest(updater);

  // set oldFile path to corrupted file
  updater.testingOptions!.cachedZipFilePath = OLD_FILE.zipPath() + ".corrupted";
  updater.httpExecutor = createHTTPExecutorMock();

  await expect(doDownloadUpdate(updater)).rejects.toThrowError(/checksum mismatch/);
  expect(updaterEventHandlers.onUpdateDownloaded).not.toBeCalled();
})