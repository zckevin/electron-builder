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
    this.blockmapPath = path.join(this.zipFilePath, `../${path.basename(this.zipFilePath)}.blockmap`);

    const ymlPrefix = "asar"
    this.ymlPaths = [
      path.join(outDir, `${ymlPrefix}.yml`),
      path.join(outDir, `${ymlPrefix}-linux.yml`),
      path.join(outDir, `${ymlPrefix}-mac.yml`),
    ];
  }

  getZipName() {
    return `${this.name}-${this.version}.asar.zip`;
  }

  setBlockmapInfo(info: any) {
    this.blockmapInfo = info;
  }
}
