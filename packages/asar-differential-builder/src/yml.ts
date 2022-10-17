import { BinaryTarget } from "./binary";
import { AppInfo, BuilderConfig } from "./config";
import { JpegChannelUpload } from "./jpeg-channel";
import * as fs from "fs"
import * as _ from "lodash"

const yaml = require('js-yaml');
const path = require('path');
const fsExtra = require("fs-extra");
const semverCmp = require('semver-compare');

function log(ymlPath: string, ymlFile: any) {
  console.log(`genYml: dump yaml file into ${ymlPath}:\n${JSON.stringify(ymlFile, null, 2)}`)
}

export async function genYml(appinfo: AppInfo, config: BuilderConfig, binaryTarget: BinaryTarget | null, zipPath: string, blockmapInfo: any) {
  const descStr = config.useJpegChannel ? (await JpegChannelUpload(zipPath, config.jpegChannelOptions!)) : "";
  console.log(`genYml: descStr: ${descStr}`);
  const ymlPath = zipPath + ".yml";
  const fileName = path.basename(zipPath);
  const newFileInfo = {
    "name": fileName,
    "url": fileName + "?desc=" + encodeURIComponent(descStr),
    "sha512": blockmapInfo.sha512,
    "size": blockmapInfo.size,
  }
  let ymlInfo = {
    version: appinfo.version,
    releaseDate: new Date().toISOString(),
    files: [
      newFileInfo,
    ],
    path: fileName,
    sha512: blockmapInfo.sha512,
  };

  // dump per-version yaml file for backup
  {
    fs.writeFileSync(ymlPath, yaml.dump(ymlInfo), "utf-8");
    log(ymlPath, ymlInfo)
  }

  // update index yaml file for update
  {
    let newIndexYml;
    const suffix = binaryTarget ? `-${binaryTarget.os}-${binaryTarget.arch}` : "";
    const indexYmlPath = path.join(config.targetDir, `${config.channel}${suffix}.yml`);
    if (fsExtra.existsSync(indexYmlPath)) {
      const oldIndexYml = yaml.load(fs.readFileSync(indexYmlPath, "utf-8"));
      // index yaml's version should be the latest one, can't be downgraded
      const versionUpdated = semverCmp(ymlInfo.version, oldIndexYml.version) > 0;
      newIndexYml = versionUpdated ? ymlInfo : oldIndexYml;
      // files should be unique by url/version
      newIndexYml.files = _.uniqBy([
        ...ymlInfo.files,
        ...oldIndexYml.files,
      ], "name");
    } else {
      newIndexYml = ymlInfo;
    }
    fs.writeFileSync(indexYmlPath, yaml.dump(newIndexYml), "utf-8");
    log(indexYmlPath, newIndexYml)
  }
}
