import { BinaryTarget } from "./binary";
import { AppInfo, BuilderConfig } from "./config";
import * as fs from "fs"
import * as fsExtra from "fs-extra"

const archiver = require('archiver');
const path = require("path")

export async function genZip(appinfo: AppInfo, config: BuilderConfig, binaryTarget: BinaryTarget | null): Promise<string> {
  const zipPath = path.join(config.targetDir, appinfo.getOutputZipName(binaryTarget));
  const output = fs.createWriteStream(zipPath);

  let appended: string[] = [];
  const archive = archiver('zip', {
    zlib: { level: config.zipLevel },
  });

  return new Promise((resolve, reject) => {
    output.on('close', function () {
      console.log(`genZip: archive finalized, total bytes: ${archive.pointer()}, ` +
        `appended dirs/files:\n${JSON.stringify(appended, null, 2)}`);
      resolve(zipPath)
    });
    archive.on('warning', function (err: any) {
      reject(err);
    });
    archive.on('error', function (err: any) {
      reject(err);
    });
    archive.pipe(output);

    const appDirPath = path.join(appinfo.resourcesDir, "app/");
    const appAsarFilePath = path.join(appinfo.resourcesDir, "app.asar");
    if (fsExtra.existsSync(appDirPath)) {
      archive.directory(appDirPath, 'resources/app');
      appended.push(appDirPath)
    } else if (fsExtra.existsSync(appAsarFilePath)) {
      archive.file(appAsarFilePath, { prefix: "resources", name: "app.asar" });
      appended.push(appAsarFilePath)
    }

    if (binaryTarget) {
      const binaryFilePath = path.join(appinfo.binaryDir, binaryTarget.name)
      archive.file(binaryFilePath, { prefix: "resources/binary", name: binaryTarget.name })
      appended.push(binaryFilePath)
    }

    archive.finalize();
  })
}
