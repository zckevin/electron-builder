const path = require('path');

export class AsarUpdateInfo {
  // e.g. //electron-updater-example/dist/electron-updater-example-0.9.1.asar.zip
  public zipFilePath: string;

  // e.g. //electron-updater-example/dist/electron-updater-example-0.9.1.asar.zip.blockmap
  public blockmapPath: string;

  public ymlPaths: string[];

  public blockmapInfo: any;

  /**
   * @param name 
   * @param version 
   * @param outDir e.g. //electron-updater-example/dist/
   * @param appOutDir e.g. //electron-updater-example/dist/linux-unpacked/
   */
  constructor(public name: string, public version: string, public outDir: string, public appOutDir: string) {
    this.zipFilePath = path.join(outDir, this.getZipName());
    this.blockmapPath = path.join(outDir, `${this.getZipName()}.blockmap`);

    // backup yml files from "asar.yml" -> "electron-update-example-0.0.1.asar.yml"
    const channel = "asar"
    let ymlFiles: Array<string> = [];
    [".yml", "-linux.yml", "-mac.yml"].forEach((suffix: string) => {
      const backupPrefix = `${this.name}-${this.version}`;
      const baseFileName = `${channel}${suffix}`;
      ymlFiles.push(baseFileName);
      ymlFiles.push(`${backupPrefix}.${baseFileName}`);
    })
    this.ymlPaths = ymlFiles.map(fileName => path.join(this.outDir, fileName));
  }

  getZipName() {
    return `${this.name}-${this.version}.asar.zip`;
  }

  setBlockmapInfo(info: any) {
    this.blockmapInfo = info;
  }
}
