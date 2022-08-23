import * as os from "os";
import { parseElectronApp } from 'electron-playwright-helpers'

const path = require("path");
const appRoot = require("app-root-path");

// appRoot is @zckevin/electron-builder
export const TEST_ROOT_DIR = path.join(appRoot.toString(), "test");
export const DIST_DIR = path.join(TEST_ROOT_DIR, "dist");
export const FIXTURES_DIR = path.join(TEST_ROOT_DIR, "fixtures");

export const YML_DUMMY_URL = new URL("https://example.com/update.yml");

export const PUBLISH_OPTIONS = {
  provider: 'generic',
  url: YML_DUMMY_URL.href,
}

class FixtureFile {
  constructor(public version: string) { }

  public zipPath(): string {
    return path.join(FIXTURES_DIR, `electron-update-example-${this.version}.asar.zip`);
  }

  public blockmapPath(): string {
    return this.zipPath() + ".blockmap";
  }

  public ymlPath(): string {
    return this.zipPath() + ".yml";
  }
}

export const OLD_FILE = new FixtureFile("0.9.25");
export const NEW_FILE = new FixtureFile("0.9.26");

export interface AppInfo {
  version: string
  name: string
  // appRoot
  rootDir: string
  // the resources dir path
  resourcesDir: string
  // main.js path
  mainFilePath: string
  // the electron binary path
  executablePath: string

  os: string
  arch: string
  // native binary suffix, e.g. windows-amd64.exe
  binarySuffix: string
}

export function getAppRootDir(version: string): string {
  let suffix = ""
  switch (os.platform()) {
    case "linux":
      suffix = "linux-unpacked";
      break
    case "win32":
      suffix = "win-unpacked";
      break
    case "darwin":
      suffix = "mac";
      break
    default:
      throw new Error(`getAppRootDir: Unknown platform: ${os.platform()}`);
  }
  const appRoot = path.join(DIST_DIR, `electron-update-example-${version}.${suffix}`);
  // if (!fsExtra.existsSync(appRoot)) {
  //   throw new Error(`getAppRootDir: App root dir not found: ${appRoot}`);
  // }
  return appRoot
}

export function getBinaryInfo() {
  let arch = os.arch();
  let operatingSystem = os.platform() as string;

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

  // windows need .exe as binary suffix
  const suffix = (operatingSystem === "windows") ? ".exe" : "";

  return {
    binarySuffix: `${operatingSystem}-${arch}${suffix}`,
    os: operatingSystem,
    arch,
  }
}

export function getAppInfo(version: string): AppInfo {
  const appRootDir = getAppRootDir(version)
  const helpersAppInfo = parseElectronApp(appRootDir)
  const name = helpersAppInfo.name
  const resourcesDir = path.join(helpersAppInfo.main, "../../");

  // inconsistent between linux & win+mac
  const executablePath = process.platform === "linux" ?
    path.join(appRootDir, name) :
    helpersAppInfo.executable;

  const binaryInfo = getBinaryInfo();

  return {
    version: version,
    name: helpersAppInfo.name,
    rootDir: appRootDir,
    resourcesDir: resourcesDir,
    executablePath: executablePath,
    mainFilePath: helpersAppInfo.main,
    ...binaryInfo,
  }
}