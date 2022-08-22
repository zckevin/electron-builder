import { AfterPackContext } from "app-builder-lib";
const path = require('path');

import { TEST_ROOT_DIR } from "../../global";
import { afterPackFns } from "./afterPack"

const platformConfig = {
  "asar": false,
  "target": "dir",
}

export const basicConfig = {
  appId: "com.github.iffy.electronupdaterexample",
  directories: {
    output: "dist",
    app: path.join(TEST_ROOT_DIR, "electron-update-example"),
  },
  linux: platformConfig,
  win: platformConfig,
  mac: platformConfig,
}

export class BuildConfig {
  private _config: any = basicConfig;

  private copyUpdateYmlToResourcesDir = false;
  private backupUnpackedProject = false;

  constructor(rootDir: string = "/invalid/path") {
    this._config.directories.app = rootDir;
  }

  get config() {
    // ** order matters! **
    this._config.afterPack = async (context: AfterPackContext) => {
      if (this.copyUpdateYmlToResourcesDir) {
        await afterPackFns.copyUpdateYmlToResourcesDir(context);
      }
      if (this.backupUnpackedProject) {
        await afterPackFns.backupUnpackedProject(context);
      }
    }
    return this._config;
  }

  withAppRoot(rootDir: string) {
    this._config.directories.app = rootDir;
    return this
  }

  withDifferentialAsar(enabled: boolean) {
    this._config.differentialAsarZip = enabled;
    return this;
  }

  withCopyUpdateYmlToResourcesDir(enabled: boolean) {
    this.copyUpdateYmlToResourcesDir = enabled;
    return this;
  }

  withBackupUnpackedProject(enabled: boolean) {
    this.backupUnpackedProject = enabled;
    return this;
  }
}