import * as os from "os";
import { parseElectronApp } from 'electron-playwright-helpers'
import * as _ from "lodash";
import * as findUp from 'find-up';

const path = require("path");

export const TEST_ROOT_DIR = __dirname
export const FIXTURES_DIR = path.join(TEST_ROOT_DIR, "fixtures");
export const DIST_DIR = process.platform === 'win32' ? path.join(TEST_ROOT_DIR, "dist") : "/tmp/electron-builder-dist";
export const TMP_DIR = '/tmp'

export const YML_DUMMY_URL = new URL("https://example.com/update.yml");

export const PUBLISH_OPTIONS = {
  provider: 'generic',
  url: YML_DUMMY_URL.href,
}
export interface BinaryTarget {
  os: string;
  arch: string;
  binarySuffix?: string;
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
  asarZipSuffix: string
}

export function getAppRootDir(testRoot: string, version: string): string {
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
  const appRoot = path.join(testRoot, `electron-update-example-${version}.${suffix}`);
  // if (!fsExtra.existsSync(appRoot)) {
  //   throw new Error(`getAppRootDir: App root dir not found: ${appRoot}`);
  // }
  return appRoot
}

export function NodeGolangPlatformTransform(s: string) {
  // left is Node.js, right is Golang
  const osMapping = [
    ["win32", "windows"],
    ["linux", "linux"],
    ["darwin", "darwin"],
  ];
  const archMapping = [
    ["ia32", "386"],
    ["x64", "amd64"],
    ["arm64", "arm64"],
  ];
  for (const [from, to] of _.union(osMapping, archMapping)) {
    if (s === from) {
      return to;
    }
    if (s === to) {
      return from;
    }
  }
  throw new Error(`NodeGolangPlatformTransform: unknown transform target: ${s}`);
}

export function getBinaryTarget() {
  const arch = NodeGolangPlatformTransform(process.arch as string)
  const os = NodeGolangPlatformTransform(process.platform as string)
  return {
    binarySuffix: `${os}-${arch}${(os === "windows") ? ".exe" : ""}`,
    os,
    arch,
  }
}

export function getAppInfo(testRoot: string, version: string): AppInfo {
  const appRootDir = getAppRootDir(testRoot, version)
  const helpersAppInfo = parseElectronApp(appRootDir)
  const name = helpersAppInfo.name
  const resourcesDir = path.join(helpersAppInfo.main, "../../");

  // inconsistent between linux & win+mac
  const executablePath = process.platform === "linux" ?
    path.join(appRootDir, name) :
    helpersAppInfo.executable;

  const target = getBinaryTarget();
  return {
    version: version,
    name: helpersAppInfo.name,
    rootDir: appRootDir,
    resourcesDir: resourcesDir,
    executablePath: executablePath,
    mainFilePath: helpersAppInfo.main,
    asarZipSuffix: `-${target.os}-${target.arch}`,
    ...target,
  }
}

export const DEFAULT_BINARY_TARGETS = [
  { os: "linux", arch: "amd64" },
  { os: "windows", arch: "amd64" },
  { os: "windows", arch: "386" },
  { os: "darwin", arch: "amd64" },
  { os: "darwin", arch: "arm64" },
];

export function getResourceDir(cwd?: string, unpackedDir?: string): string {
  if (!cwd) {
    const helpersAppInfo = parseElectronApp(unpackedDir!);
    cwd = helpersAppInfo.main;
  }
  const resourceDir = findUp.sync("resources", { type: "directory", cwd });
  if (!resourceDir) {
    throw new Error(`getResourceDir: resources dir not found`);
  }
  return resourceDir;
}