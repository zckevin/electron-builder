import { generateProjectForE2e } from "./playwright/helper";
import { randomDirName } from "./units/helper";
import { ElectronBuilderConfig } from "./electron-builder-config"
import { buildElectronFull } from "./electron-project-builder"
import { getBinaryTarget } from "./global";

const { program } = require('commander');
const fsExtra = require('fs-extra');
const path = require("path");
const httpServer = require('http-server');

const serverPort = 10087;

async function createStaticServer(root: string) {
  const fileServer = httpServer.createServer({ root })
  fileServer.listen(serverPort)
  return fileServer
}

program
  .command("serve")
  .arguments("<n_versions> <destDir>")
  .action(async (n_versions: string, destDir: string) => {
    const versions = Array.from({ length: parseInt(n_versions) }, (_, i) => `0.0.${i + 1}`);
    const newDestDir = path.join(destDir, randomDirName('electron-updater-example-demo'));
    console.log(`Build v[${versions}] to ${newDestDir}...`)
    fsExtra.ensureDirSync(newDestDir);
    await generateProjectForE2e(versions, newDestDir)
    console.log(
`************************************************************
HTTP static server listening on 0.0.0.0:${serverPort}
Serving ${newDestDir}
************************************************************`);
    createStaticServer(newDestDir);
  })

program
  .command("build")
  .arguments("<appRoot> <destDir>")
  .option("--os <os>", "os")
  .option("--arch <arch>", "arch")
  .action(async (appRoot: string, destDir: string, options: any) => {
    const electronBuilderConfig = new ElectronBuilderConfig(appRoot)
      .withOutputDir(destDir)
      .withBinaryDir(true)
      .withAsar(true)
    const { os, arch } = getBinaryTarget()
    await buildElectronFull(electronBuilderConfig, {
      os: options.os || os,
      arch: options.arch || arch,
    })
  })

program.parse();
