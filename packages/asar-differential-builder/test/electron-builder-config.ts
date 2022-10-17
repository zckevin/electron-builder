const path = require('path');
import * as _ from 'lodash';
import { afterPackWithConfig } from "../src/index"
import { BuilderConfig } from "../src/config"

const platformConfig = {
  asar: false,
  target: "dir",
}

export const electronBuilderBaseConfig = {
  appId: "com.github.iffy.electronupdaterexample",
  files: [
    "!binary/**",
  ],
  linux: platformConfig,
  win: platformConfig,
  mac: platformConfig,
}

export class ElectronBuilderConfig {
  public _config: any = _.cloneDeep(electronBuilderBaseConfig);
  public appRoot?: string;
  public outputDir?: string;
  public differentialBuilderConfig?: BuilderConfig;
  public binaryDirEnabled: boolean = false;
  public asarEnabled: boolean = false;

  constructor(rootDir: string = "/invalid/path") {
    this.appRoot = rootDir
  }

  get config() {
    // TODO: add a checker to do this
    if (this.appRoot === "/invalid/path") {
      throw new Error("ElectronBuilderConfig: appRoot is not set")
    }
    if (!this.outputDir) {
      throw new Error("ElectronBuilderConfig: outputDir is not set")
    }
    // if (!this.differentialBuilderConfig) {
    //   throw new Error("ElectronBuilderConfig: differentialBuilderConfig is not set")
    // }

    this._config = _.merge(this._config, {
      directories: {
        output: this.outputDir,
        app: this.appRoot,
      },
      afterPack: afterPackWithConfig(this.differentialBuilderConfig!),
    });
    if (this.binaryDirEnabled) {
      this._config = _.merge(this._config, {
        extraResources: [{
          from: path.join(this.appRoot, "binary"),
          to: "binary",
          filter: [
            "**/*",
          ]
        }],
      })
    }
    if (this.asarEnabled) {
      this._config.linux.asar = true;
      this._config.win.asar = true;
      this._config.mac.asar = true;
    }
    return this._config;
  }

  withAppRoot(rootDir: string) {
    this.appRoot = rootDir;
    return this
  }

  withOutputDir(outputDir: string) {
    this.outputDir = outputDir;
    return this
  }

  withDifferentialBuilderConfig(config: BuilderConfig) {
    this.differentialBuilderConfig = config;
    return this;
  }

  withBinaryDir(enabled: boolean) {
    this.binaryDirEnabled = enabled;
    if (this.differentialBuilderConfig) {
      this.differentialBuilderConfig.includesBinaryDir = enabled;
    }
    return this
  }

  withAsar(enabled: boolean) {
    this.asarEnabled = enabled;
    return this;
  }
}