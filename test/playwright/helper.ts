import * as builder from 'electron-builder'
import { _electron as electron } from 'playwright'
import * as fsExtra from "fs-extra";
const symlinkDir = require('symlink-dir')
const path = require('path')

import { platform } from "../units/electron-builder/helper"
import { BuildConfig } from "../units/electron-builder/config"
import { TEST_ROOT_DIR, DIST_DIR, AppInfo } from "../global"
import { generateElectronProject } from "../builder"

export async function buildElectron(config: BuildConfig) {
  const args = {
    config: config.config,
    targets: platform.createTarget(),
  }
  await builder.build(args)
    .catch((error: any) => {
      throw error;
    })
}

export async function generateElectronProjectAndBuild(version: string, config: BuildConfig) {
  const rootDir = path.join(DIST_DIR, `builder-root-${version}`)
  generateElectronProject(version, rootDir)
  await buildElectron(config.withAppRoot(rootDir))
}

export async function generateTestingProjects(versions: string[]) {
  for (const version of versions) {
    await generateElectronProjectAndBuild(
      version,
      new BuildConfig()
        .withDifferentialAsar(true)
        .withCopyUpdateYmlToResourcesDir(true)
        .withBackupUnpackedProject(true)
    )
  }
}

export async function spawnExecutable(appInfo: AppInfo) {
  // HACK here
  linkModuleToOutDir(appInfo)

  const electronApp = await electron.launch({
    args: [appInfo.mainFilePath],
    executablePath: appInfo.executablePath,
    timeout: 3 * 60 * 1000,
  })
  electronApp.on('window', async (page) => {
    const filename = page.url()?.split('/').pop()
    console.log(`Window opened: ${filename}`)

    // capture errors
    page.on('pageerror', (error) => {
      console.error(error)
    })
    // capture console messages
    page.on('console', (msg) => {
      console.log(msg.text())
    })
  })
  return electronApp
}

async function linkModuleToOutDir(appInfo: AppInfo) {
  const moduleName = "electron-updater";
  const moduleDir = path.join(TEST_ROOT_DIR, "../packages/", moduleName);
  const destDir = path.join(appInfo.mainFilePath, "../node_modules/");
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
