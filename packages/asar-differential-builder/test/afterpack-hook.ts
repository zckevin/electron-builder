import { AfterPackContext } from "app-builder-lib";
import { parseElectronApp } from 'electron-playwright-helpers'
import * as fsExtra from "fs-extra";
import { getResourceDir } from './global';
const path = require('path');
const yaml = require('js-yaml');

export async function addUpdateYmlToResourcesDir(context: AfterPackContext) {
  // contents does not matter
  const appUpdateYmlObj = {
    owner: "iffy",
    repo: "electron-update-example",
    provider: "github",
  }
  const appInfo = parseElectronApp(context.appOutDir);
  // dest is resources dir
  const destDir = getResourceDir(appInfo.main);
  if (!fsExtra.existsSync(destDir)) {
    throw new Error(`addUpdateYmlToResourcesDir: Cannot find dir: ${destDir}`);
  }
  fsExtra.writeFileSync(
    path.join(destDir, "app-update.yml"),
    yaml.dump(appUpdateYmlObj),
    "utf-8"
  );
  console.log(`addUpdateYmlToResourcesDir: dump app-update.yml to ${destDir}`);
}

export async function backupUnpackedProject(context: AfterPackContext) {
  const possibleNames = [
    "linux-unpacked/",
    "win-unpacked/",
    "mac/",
  ]
  const rootDir = context.outDir;
  const prefix = `${context.packager.appInfo.productName}-${context.packager.appInfo.version}`;
  for (const name of possibleNames) {
    const srcFilePath = path.join(rootDir, name);
    if (fsExtra.existsSync(srcFilePath)) {
      const dstFilePath = path.join(rootDir, `${prefix}.${name}`);
      fsExtra.copySync(srcFilePath, dstFilePath);
      console.log(`backupUnpackedProject: Backup artifact ${srcFilePath} to ${dstFilePath}`);
      return
    }
  }
  throw new Error(`backupUnpackedProject: Cannot find any possible names in DIST_DIR: ${possibleNames}`);
}
