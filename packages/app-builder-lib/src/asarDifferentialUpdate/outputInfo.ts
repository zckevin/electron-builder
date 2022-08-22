import { parseElectronApp } from 'electron-playwright-helpers'
const path = require('path');

export class AsarOutputInfo {
  public zipName: string;
  // e.g. //electron-updater-example/dist/electron-updater-example-0.9.1.asar.zip
  public zipFilePath: string
  // e.g. //electron-updater-example/dist/electron-updater-example-0.9.1.asar.zip.blockmap
  public blockmapPath: string
  public blockmapInfo: any | null
  public ymlPaths: string[]
  /**
   * the (input) resources dir to pack into the the output zip
   */
  public resourcesDir: string

  /**
   * @param name 
   * @param version 
   * @param outDir e.g. //electron-updater-example/dist/
   * @param appOutDir e.g. //electron-updater-example/dist/linux-unpacked/
   */
  constructor(public name: string, public version: string, public outDir: string, public appOutDir: string) {
    this.zipName = `${this.name}-${this.version}.asar.zip`;
    this.zipFilePath = path.join(outDir, this.zipName);
    this.blockmapPath = path.join(outDir, `${this.zipName}.blockmap`)

    // copy/rename yml files from "asar.yml" -> "electron-update-example-0.0.1.asar.yml"
    const channel = "asar"
    let ymlFiles: Array<string> = [];
    [".yml", "-linux.yml", "-mac.yml"].forEach((suffix: string) => {
      const backupPrefix = `${this.name}-${this.version}`;
      const baseFileName = `${channel}${suffix}`;
      ymlFiles.push(baseFileName);
      ymlFiles.push(`${backupPrefix}.${baseFileName}`);
    })
    this.ymlPaths = ymlFiles.map(fileName => path.join(outDir, fileName));

    const appInfo = parseElectronApp(this.appOutDir);
    this.resourcesDir = path.join(appInfo.main, '../../');
  }

  setBlockmapInfo(info: any) {
    this.blockmapInfo = info;
  }
}