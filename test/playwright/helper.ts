import * as builder from 'electron-builder'
import { platform } from "../units/electron-builder/helper"
import { BuildConfig } from "../units/electron-builder/config"
import { DIST_DIR } from "../global"
import { parseElectronApp } from 'electron-playwright-helpers'
import { _electron as electron } from 'playwright'
const { generateElectronProject } = require("../builder.js")
const path = require('path')

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
  const appRootDir = `electron-update-example-${version}.linux-unpacked`
  const appInfo = parseElectronApp(path.join(DIST_DIR, appRootDir))

  const electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: path.join(DIST_DIR, appRootDir, "electron-update-example"),
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

