import { AsarUpdater } from "electron-updater";
import { OLD_FILE, PUBLISH_OPTIONS } from "../../global";
import { tuneUpdaterForTest, doDownloadUpdate } from "./helper"
import { createHTTPExecutorMock } from "./httpExecutor"
import { createTestAppAdapter } from "../helpers/updaterTestUtil"

var updater: AsarUpdater;
var updaterEventHandlers: any;

beforeEach(async () => {
  jest.clearAllMocks();

  updater = new AsarUpdater(PUBLISH_OPTIONS as any, await createTestAppAdapter(OLD_FILE.version));
  updaterEventHandlers = {
    onUpdateDownloaded: jest.fn(),
  }
  updater.on("update-downloaded", updaterEventHandlers.onUpdateDownloaded);
})

test("Should fallback to full download if `oldFile`(cached zip) does not exists", async () => {
  tuneUpdaterForTest(updater);

  try {
    await doDownloadUpdate(updater);
  } catch (e: any) {
    expect(e.message).toMatch(/current\.asar\.zip.*does not exist/);
    return
  }
})

test("Full download fallback should call httpExecutor.download()", async () => {
  tuneUpdaterForTest(updater);

  // for updater to fallback to full download
  updater.asarTestingOptions!.throwOnFallback = false;
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
  updater.asarTestingOptions!.cachedZipFilePath = OLD_FILE.zipPath();
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
  updater.asarTestingOptions!.cachedZipFilePath = OLD_FILE.zipPath() + ".corrupted";
  updater.httpExecutor = createHTTPExecutorMock();

  try {
    await doDownloadUpdate(updater);
  } catch (e: any) {
    expect(e.message).toMatch(/checksum mismatch/);
    return
  }

  expect(updaterEventHandlers.onUpdateDownloaded).not.toBeCalled();
})