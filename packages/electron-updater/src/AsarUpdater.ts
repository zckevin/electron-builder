import * as path from "path"
import { AllPublishOptions, BlockMap } from "builder-util-runtime"
import { DownloadUpdateOptions } from "./AppUpdater"
import { BaseUpdater, InstallOptions } from "./BaseUpdater"
import { DifferentialDownloaderOptions } from "./differentialDownloader/DifferentialDownloader"
import { GenericDifferentialDownloader } from "./differentialDownloader/GenericDifferentialDownloader"
import { DOWNLOAD_PROGRESS, ResolvedUpdateFileInfo } from "./main"
import { Provider } from "./providers/Provider"
import { blockmapFiles } from "./util"
import { gunzipSync } from "zlib"
import { copySync, existsSync } from "fs-extra"
import * as AdmZip from "adm-zip"
import { ElectronHttpExecutor } from "./electronHttpExecutor"
import * as semverSort from 'semver-sort';
import { app } from "electron"
const semverCmp = require('semver-compare');

const CACHED_ZIP_FILE_NAME = "current.asar.zip"

export interface AsarUpdaterTesingOptions {
  throwOnFallback?: boolean
  ignoreRealInstall?: boolean
  ignoreRealZipBackup?: boolean
  removePendingZip?: boolean
  cachedZipFilePath?: string
}

export class AsarUpdaterConfig {
  autoDownload = true
  includesBinaryDir = true
  allowDowngrade = false
}

export class AsarUpdater extends BaseUpdater {
  // could be set on tesing
  public appVersion: string = this.app.version
  public testingOptions: AsarUpdaterTesingOptions | undefined
  public config: AsarUpdaterConfig | undefined;

  constructor(
    config?: AsarUpdaterConfig,
    testingOptions?: AsarUpdaterTesingOptions,
    options?: AllPublishOptions | null,
    app?: any,
  ) {
    super(options, app)
    this.config = config;
    this.testingOptions = testingOptions;
    if (this.config?.autoDownload === false) {
      this.autoDownload = false
    }
    this._logger.info(`Construct AsarUpdater with config: \n` +
      `${JSON.stringify(this.config, null, 2)}\n` +
      `${JSON.stringify(this.testingOptions, null, 2)}`
    )
  }

  public isUpdaterActive(): boolean {
    return true
  }

  public getHttpExecutor(): ElectronHttpExecutor {
    return this.httpExecutor
  }

  // e.g. /home/zc/.cache/electron-updater-example-updater/ 
  // not  /home/zc/.cache/electron-updater-example-updater/pending/
  //
  // warning: this.downloadedUpdateHelper is set after calling this.executeDownload()
  private getCachedZipFile(): string {
    if (this.testingOptions?.cachedZipFilePath) {
      return this.testingOptions.cachedZipFilePath
    }
    const filePath = path.join(this.downloadedUpdateHelper!.cacheDir, CACHED_ZIP_FILE_NAME)
    return filePath
  }

  private backupDownloadAsarZip(downloadedFilePath: string): void {
    this._logger.info(`Backup downloaded asar zip(${downloadedFilePath}) to parent folder`)
    if (this.testingOptions?.ignoreRealZipBackup) {
      this._logger.info("AsarUpdater: testonly, ignoring real zip backup")
      return
    }
    copySync(downloadedFilePath, this.getCachedZipFile())
  }

  public doDownloadUpdate(downloadUpdateOptions: DownloadUpdateOptions, selectedTargetUrl?: string): Promise<Array<string>> {
    // remove already downloaded zip in $CACHE_DIR/$PROJECT_NAME/pending/ for testing
    if (this.testingOptions?.removePendingZip) {
      if (!this._testOnlyOptions) {
        this._testOnlyOptions = { platform: (process.platform as any) }
      }
      this._testOnlyOptions.removePendingZip = true
    }

    const provider = downloadUpdateOptions.updateInfoAndProvider.provider
    let fileInfo: ResolvedUpdateFileInfo;
    if (this.config?.allowDowngrade && selectedTargetUrl) {
      const selectedVersion = this.parseSemverFromFileName(selectedTargetUrl)
      console.log("=====", selectedVersion, this.appVersion)
      if (semverCmp(this.appVersion, selectedVersion) === 0) {
        throw new Error(`AsarUpdater: can't update to the exact same version ${selectedVersion}`)
      }
      fileInfo = provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info).find(it => it.url.href.includes(selectedTargetUrl))!
    } else {
      fileInfo = this.getLatestFile(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "zip")!
    }
    if (!fileInfo) {
      console.error(
        this.config?.allowDowngrade,
        selectedTargetUrl,
        provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info)
      );
      throw new Error(`No file found for provided selectedTargetUrl: ${selectedTargetUrl}`)
    }
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
      // console.log("zcsb", fileInfo, this.appVersion, downloadUpdateOptions.updateInfoAndProvider.info)
      const selectedVersion = this.parseSemverFromFileName(fileInfo.url.toString())
      const blockmapFileUrls = blockmapFiles(fileInfo.url, this.appVersion, selectedVersion);
      this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`)

      const downloadOptions: DifferentialDownloaderOptions = {
        newUrl: fileInfo.url,
        oldFile: this.getCachedZipFile(),
        logger: this._logger,
        newFile: installerPath,
        // isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        isUseMultipleRangeRequest: false,
        requestHeaders: downloadUpdateOptions.requestHeaders,
        cancellationToken: downloadUpdateOptions.cancellationToken,
      }

      if (this.listenerCount(DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = it => this.emit(DOWNLOAD_PROGRESS, it)
      }

      const blockMapDataList = await Promise.all(blockmapFileUrls.map(u => this.downloadBlockMap(u, downloadUpdateOptions)))
      await new GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(blockMapDataList[0], blockMapDataList[1])
      return false
    } catch (e: any) {
      this._logger.info(`Cannot download differentially, fallback to full download: ${e.stack || e}`)
      if (this.testingOptions?.throwOnFallback) {
        throw e
      }
      return true
    }
  }

  protected doInstall(options: InstallOptions): boolean {
    const resourcesDirPath = this.getResourceDirPath();
    if (!existsSync(resourcesDirPath)) {
      throw new Error(`AsarUpdater: Cannot find resources dir "${resourcesDirPath}", update abort`)
    }
    this._logger.info("AsarUpdater: extracting to " + resourcesDirPath);
    if (this.testingOptions?.ignoreRealInstall) {
      this._logger.info("AsarUpdater: testonly, ignoring real install");
      return true
    }
    const zip = new AdmZip(options.installerPath);
    // WARN: extract to resources dir's parent folder
    zip.extractAllTo(path.join(resourcesDirPath, ".."), /*overwrite*/ true, /*permissions*/ true);
    return true
  }

  private getResourceDirPath(): string {
    const exePath = app.getPath("exe");
    switch(process.platform) {
      case "darwin":
        // WARN: capitalized resources dir name
        return path.join(path.dirname(exePath), "..", "Resources");
      default:
        return path.join(path.dirname(exePath), "resources");
    }
  }

  public getChannelYmlFullName() {
    let arch = process.arch as string;
    let operatingSystem = process.platform as string;

    // special name mapping from Node -> Go
    switch (arch) {
      case "x64":
        arch = "amd64";
        break;
      case "ia32":
        arch = "386";
        break;
    }
    switch (operatingSystem) {
      case "win32":
        operatingSystem = "windows";
        break;
    }

    return this.config?.includesBinaryDir ? `-${operatingSystem}-${arch}` : ''
  }

  private parseSemverFromFileName(fileName: string) {
    const match = fileName.match(/-(\d+\.\d+\.\d+)/)
    if (!match) {
      throw new Error(`Cannot parse semver from file name "${fileName}"`)
    }
    return match[1]
  }

  private getLatestFile(files: Array<ResolvedUpdateFileInfo>, extension: string, not?: Array<string>): ResolvedUpdateFileInfo | null | undefined {
    const filteredFileNames = files.filter(it => it.url.pathname.toLowerCase().endsWith(`.${extension}`)).map(it => path.basename(it.url.pathname))
    if (filteredFileNames.length === 0) {
      throw new Error(`No files with extension [.${extension}] found in UpdateInfo files: ${JSON.stringify(files)}`)
    }
    try {
      const semvers = filteredFileNames.map(name => this.parseSemverFromFileName(name))
      const latest = semverSort.desc(semvers)[0];
      return files.find(it => it.url.pathname.includes(latest));
    } catch(err) {
      console.error("getLatestFile:", files, filteredFileNames, extension)
      throw err
    }
  }
}
