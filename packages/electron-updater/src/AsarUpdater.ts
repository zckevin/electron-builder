import * as path from "path"
import { AllPublishOptions, BlockMap } from "builder-util-runtime"
import { DownloadUpdateOptions } from "./AppUpdater"
import { BaseUpdater, InstallOptions } from "./BaseUpdater"
import { DifferentialDownloaderOptions } from "./differentialDownloader/DifferentialDownloader"
import { GenericDifferentialDownloader } from "./differentialDownloader/GenericDifferentialDownloader"
import { DOWNLOAD_PROGRESS, ResolvedUpdateFileInfo } from "./main"
import { findFile, Provider } from "./providers/Provider"
import { blockmapFiles } from "./util"
import { gunzipSync } from "zlib"
import { copySync } from "fs-extra"
import * as AdmZip from "adm-zip"
import { ElectronHttpExecutor } from "./electronHttpExecutor"
import * as fs from "fs"

const CACHED_ZIP_FILE_NAME = "current.asar.zip"

export interface AsarUpdaterTesingOptions {
  throwOnFallback?: boolean
  ignoreRealInstall?: boolean
  ignoreRealZipBackup?: boolean
  removeCachedZip?: boolean
  removePendingZip?: boolean

  getCachedZipFile?: () => string
}

export class AsarUpdater extends BaseUpdater {
  // could be set on tesing
  public appVersion: string = this.app.version
  public asarTestingOptions: AsarUpdaterTesingOptions | null = null

  constructor(options?: AllPublishOptions | null, app?: any) {
    super(options, app)
    this.allowDowngrade = true
  }

  public isUpdaterActive(): boolean {
    return true
    // if (process.env["APPIMAGE"] == null) {
    //   if (process.env["SNAP"] == null) {
    //     this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage")
    //   } else {
    //     this._logger.info("SNAP env is defined, updater is disabled")
    //   }
    //   return false
    // }
    // return super.isUpdaterActive()
  }

  public getHttpExecutor(): ElectronHttpExecutor {
    return this.httpExecutor
  }

  // e.g. /home/zc/.cache/electron-updater-example-updater/ 
  // not  /home/zc/.cache/electron-updater-example-updater/pending/
  //
  // warning: this.downloadedUpdateHelper is set after calling this.executeDownload()
  private getCachedZipFile(): string {
    if (this.asarTestingOptions?.getCachedZipFile) {
      return this.asarTestingOptions.getCachedZipFile()
    }

    const filePath = path.join(this.downloadedUpdateHelper!.cacheDir, CACHED_ZIP_FILE_NAME)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Cached file "${filePath}" does not exist`)
    }
    return filePath
  }

  private backupDownloadAsarZip(downloadedFilePath: string): void {
    this._logger.info(`Backup downloaded asar zip(${downloadedFilePath}) to parent folder`)
    if (this.asarTestingOptions?.ignoreRealZipBackup) {
      this._logger.info("AsarUpdater: testonly, ignoring real zip backup")
      return
    }
    copySync(downloadedFilePath, this.getCachedZipFile())
  }

  public doDownloadUpdate(downloadUpdateOptions: DownloadUpdateOptions): Promise<Array<string>> {
    if (this.asarTestingOptions) {
      this._logger.info(`AsarUpdater testing mode config: ${JSON.stringify(this.asarTestingOptions)}`)
    }

    // if (this.asarTestingOptions?.removeCachedZip) {
    //   try {
    //     const filePath = this.getCachedZipFile();
    //     fs.unlinkSync(filePath);
    //     this._logger.info(`AsarUpdater testing mode: remove cached zip`)
    //   } catch (err) { }
    // }

    if (this.asarTestingOptions?.removePendingZip) {
      if (!this._testOnlyOptions) {
        this._testOnlyOptions = { platform: (process.platform as any) }
      }
      this._testOnlyOptions.removePendingZip = true
    }

    const provider = downloadUpdateOptions.updateInfoAndProvider.provider
    const fileInfo = findFile(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "zip")!
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo,
      downloadUpdateOptions,
      task: async (destinationFile, downloadOptions) => {
        const fallbackToFullDownload = await this.differentialDownloadInstaller(fileInfo, downloadUpdateOptions, destinationFile, provider)
        if (fallbackToFullDownload) {
          await this.httpExecutor.download(fileInfo.url, destinationFile, downloadOptions)
        }

        // backup newly downloaded file to parent folder
        this.backupDownloadAsarZip(destinationFile)
      },
    })
  }

  public async downloadBlockMap(url: URL, downloadUpdateOptions: DownloadUpdateOptions): Promise<BlockMap> {
    const data = await this.httpExecutor.downloadToBuffer(url, {
      headers: downloadUpdateOptions.requestHeaders,
      cancellationToken: downloadUpdateOptions.cancellationToken,
    })

    if (data == null || data.length === 0) {
      throw new Error(`Blockmap "${url.href}" is empty`)
    }

    try {
      return JSON.parse(gunzipSync(data).toString())
    } catch (e) {
      throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`)
    }
  }

  private async differentialDownloadInstaller(
    fileInfo: ResolvedUpdateFileInfo,
    downloadUpdateOptions: DownloadUpdateOptions,
    installerPath: string,
    provider: Provider<any>
  ): Promise<boolean> {
    try {
      const blockmapFileUrls = blockmapFiles(fileInfo.url, this.appVersion, downloadUpdateOptions.updateInfoAndProvider.info.version)
      this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`)

      const downloadOptions: DifferentialDownloaderOptions = {
        newUrl: fileInfo.url,
        oldFile: this.getCachedZipFile(),
        logger: this._logger,
        newFile: installerPath,
        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        requestHeaders: downloadUpdateOptions.requestHeaders,
        cancellationToken: downloadUpdateOptions.cancellationToken,
      }

      if (this.listenerCount(DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = it => this.emit(DOWNLOAD_PROGRESS, it)
      }

      const blockMapDataList = await Promise.all(blockmapFileUrls.map(u => this.downloadBlockMap(u, downloadUpdateOptions)))
      await new GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(blockMapDataList[0], blockMapDataList[1])
      return false
    } catch (e) {
      this._logger.info(`Cannot download differentially, fallback to full download: ${e.stack || e}`)
      if (this.asarTestingOptions?.throwOnFallback) {
        throw e
      }
      return true
    }
  }

  protected doInstall(options: InstallOptions): boolean {
    const exePath = require("electron").app.getPath("exe");
    const resourcesDirPath = path.dirname(exePath);

    this._logger.info("AsarUpdater: extracting to " + resourcesDirPath);
    if (this.asarTestingOptions?.ignoreRealInstall) {
      this._logger.info("AsarUpdater: testonly, ignoring real install");
      return true
    }
    const zip = new AdmZip(options.installerPath);
    zip.extractAllTo(resourcesDirPath, /*overwrite*/ true, /*permissions*/ true);
    return true
  }
}
