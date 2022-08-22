import { AfterPackContext } from "app-builder-lib";
import { parseElectronApp } from 'electron-playwright-helpers'
import * as fsExtra from "fs-extra";
const path = require('path');

import { TEST_ROOT_DIR } from "../../global";

export type AfterPackCallback = (context: AfterPackContext) => Promise<void>;

async function copyUpdateYmlToResourcesDir(context: AfterPackContext) {
  const srcFilePath = path.join(TEST_ROOT_DIR, "fixtures/app-update.yml");
  const appInfo = parseElectronApp(context.appOutDir);
  // resources dir
  const destDir = path.join(appInfo.main, "../../");
  if (!fsExtra.existsSync(srcFilePath)) {
    throw new Error(`copyUpdateYmlToResourcesDir: Cannot find app-update.yml: ${destDir}`);
  }
  if (!fsExtra.existsSync(destDir)) {
    throw new Error(`copyUpdateYmlToResourcesDir: Cannot find dir: ${destDir}`);
  }
  fsExtra.copyFileSync(srcFilePath, path.join(destDir, "app-update.yml"));
  console.log(`copyUpdateYmlToResourcesDir: Copied ${srcFilePath} to ${destDir}`);
}

async function backupUnpackedProject(context: AfterPackContext) {
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

export const afterPackFns = {
  copyUpdateYmlToResourcesDir,
  backupUnpackedProject,
}