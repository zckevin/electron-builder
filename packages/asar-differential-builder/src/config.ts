import { parseElectronApp } from 'electron-playwright-helpers'
import { findBinaryTargetsInDir, BinaryTarget } from './binary';
import { getResourceDir } from '../test/global';
import { JpegChannelOptions } from "./jpeg-channel";
const path = require('path');

export class TestingOptions {
  public backupUnpackedAppRoot = false;
}

export class BuilderConfig {
  // channel name of the output yml file
  public channel: string = 'asar';
  // if app has any platform specific binaries
  public includesBinaryDir: boolean = true;
  // output dir of all the artifacts
  public targetDir: string = "";

  public zipLevel = 1 // fastest;

  public testingOptions: TestingOptions = new TestingOptions();

  public useJpegChannel: boolean = true;
  public jpegChannelOptions?: JpegChannelOptions;

  constructor(targetDir: string) {
    this.targetDir = targetDir;
  }
}

export class AppInfo {
  version: string
  name: string
  // main.js path
  mainFilePath: string
  // the electron binary path
  executablePath: string
  // electron-builder generated unpacked dir
  unpackedDir: string
  // the resource dir in app
  resourcesDir: string
  // the binary files dir in app
  binaryDir: string
  binaryTargets: BinaryTarget[] | undefined

  constructor(name: string, version: string, unpackedDir: string, config?: BuilderConfig) {
    if (name.includes('/')) {
      this.name = name.split('/').pop()!;
    } else {
      this.name = name;
    }
    this.version = version;
    this.unpackedDir = unpackedDir;

    try {
      const helpersAppInfo = parseElectronApp(unpackedDir)
      this.resourcesDir = getResourceDir(helpersAppInfo.main);
      this.binaryDir = path.join(this.resourcesDir, "binary");
      // inconsistent between linux & win+mac
      this.executablePath = process.platform === "linux" ?
        path.join(unpackedDir, name) :
        helpersAppInfo.executable;
      this.mainFilePath = helpersAppInfo.main;
    } catch (err) {
      console.error(`Fatal: can't find a valid electron project in dir: ${unpackedDir}`)
      throw err;
    }

    // generate asar.zip for every found target in /binary dir
    if (config?.includesBinaryDir) {
      this.binaryTargets = findBinaryTargetsInDir(this.binaryDir)
      if (this.binaryTargets.length <= 0) {
        throw new Error(`No valid binary files found in dir: ${this.binaryDir}`)
      }
    }
  }

  getOutputZipName(binaryTarget: BinaryTarget | null) {
    const zipSuffix = ".asar.zip";
    const binarySuffix = binaryTarget ? `-${binaryTarget.os}-${binaryTarget.arch}` : ''
    return `${this.name}-${this.version}${binarySuffix}${zipSuffix}`
  }
}