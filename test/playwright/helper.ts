import * as builder from 'electron-builder'
import { parseElectronApp } from 'electron-playwright-helpers'
import { _electron as electron } from 'playwright'
const path = require('path')

import { platform } from "../units/electron-builder/helper"
import { BuildConfig } from "../units/electron-builder/config"
import { DIST_DIR, getAppRootDir } from "../global"
const { generateElectronProject } = require("../builder.js")

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
        .withLinkElectronUpdaterToOutDir(true)
        .withCopyUpdateYmlToResourcesDir(true)
        .withBackupUnpackedProject(true)
    )
  }
}

export async function spawnExecutable(version: string) {
  const appRootDir = getAppRootDir(version)
  const appInfo = parseElectronApp(appRootDir)
  const executablePath = process.platform === "linux" ?
    path.join(appRootDir, "electron-update-example") :
    appInfo.executable;
  
  const electronApp = await electron.launch({
    args: [appInfo.main],
    timeout: 10 * 60 * 1000,
    executablePath,
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

