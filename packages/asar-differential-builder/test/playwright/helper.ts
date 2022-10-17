import { _electron as electron } from 'playwright'
import { ipcMainInvokeHandler } from 'electron-playwright-helpers'
const path = require('path')

import { AppInfo } from "../global"
import { generateElectronProject } from "../electron-project-generator"
import { ElectronBuilderConfig } from "../electron-builder-config"
import { buildElectronAsar } from "../electron-project-builder"
import { BuilderConfig } from '../../src/config';
import { JpegChannelOptions } from "../../src/jpeg-channel";

export async function spawnExecutable(appInfo: AppInfo) {
  const electronApp = await electron.launch({
    args: [appInfo.mainFilePath],
    executablePath: appInfo.executablePath,
    timeout: 2 * 60 * 1000,
  });
  electronApp.on('window', async (page) => {
    // capture errors
    page.on('pageerror', (error) => {
      console.error('Electron page error:', error)
    })
    // capture console messages
    page.on('console', (msg) => {
      console.log(msg.text())
    })
  })
  await ipcMainInvokeHandler(electronApp, "waitForReady")
  return electronApp
}

export async function generateProjectForE2e(
  versions: string[],
  destDir: string,
  asar: boolean = true,
  useJpegChannel: boolean = false,
) {
  // MUST run seqentially,
  // cause we build the project into same targetDir,
  // if we run parallel, the files would be corrupted and throw
  for (const version of versions) {
    const targetDir = destDir
    const appRoot = path.join(destDir, `electron-updater-example-${version}`)
    generateElectronProject(version, appRoot)

    const includesBinaryDir = true;
    const differencialBuilderConfig = new BuilderConfig(targetDir);
    differencialBuilderConfig.testingOptions.backupUnpackedAppRoot = true;
    differencialBuilderConfig.useJpegChannel = useJpegChannel;
    differencialBuilderConfig.jpegChannelOptions = new JpegChannelOptions();

    const electronBuilderConfig =
      new ElectronBuilderConfig(appRoot)
        .withOutputDir(differencialBuilderConfig.targetDir)
        .withDifferentialBuilderConfig(differencialBuilderConfig)
        .withBinaryDir(includesBinaryDir)
        .withAsar(asar)
    await buildElectronAsar(electronBuilderConfig)
  }
}
