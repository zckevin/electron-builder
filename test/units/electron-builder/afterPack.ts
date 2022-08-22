import { AfterPackContext } from "app-builder-lib";
import * as fsExtra from "fs-extra";
const symlinkDir = require('symlink-dir')
const path = require('path');

import { TEST_ROOT_DIR } from "../../global";

export type AfterPackCallback = (context: AfterPackContext) => Promise<void>;

async function linkModuleToOutDir(context: AfterPackContext) {
  const moduleName = "electron-updater";
  const moduleDir = path.join(TEST_ROOT_DIR, "../packages/", moduleName);
  const destDir = path.join(context.appOutDir, "resources/app/node_modules/");
  if (!fsExtra.existsSync(moduleDir)) {
    throw new Error(`linkModulesToOutDir: Source module doesn't exist: ${moduleDir}`);
  }
  fsExtra.ensureDirSync(destDir);
  const { warn } = await symlinkDir(moduleDir, path.join(destDir, moduleName))
  if (warn) {
    throw new Error(`linkModulesToOutDir error: ${warn}`);
  }
  console.log(`linkModulesToOutDir: Linked ${moduleDir} to ${destDir}`);
}

async function copyUpdateYmlToResourcesDir(context: AfterPackContext) {
  const srcFilePath = path.join(TEST_ROOT_DIR, "fixtures/app-update.yml");
  const destDir = path.join(context.appOutDir, "resources/");
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
  const srcFiles = [
    "linux-unpacked/"
  ]
  const rootDir = context.outDir;
  const prefix = `${context.packager.appInfo.productName}-${context.packager.appInfo.version}`;
  for (const name of srcFiles) {
    const srcFilePath = path.join(rootDir, name);
    if (!fsExtra.existsSync(srcFilePath)) {
      throw new Error(`backupUnpackedProject: Cannot find srcFile: ${srcFilePath}`);
    }
    const dstFilePath = path.join(rootDir, `${prefix}.${name}`);
    fsExtra.copySync(srcFilePath, dstFilePath);
    console.log (`backupUnpackedProject: Backup artifact ${srcFilePath} to ${dstFilePath}`);
  }
}

export const afterPackFns = {
  linkModuleToOutDir,
  copyUpdateYmlToResourcesDir,
  backupUnpackedProject,
}