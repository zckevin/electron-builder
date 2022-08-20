const path = require('path');
import { AfterPackContext } from "../index"
import { AsarUpdateInfo } from "./updateInfo";
import { writeUpdateInfoFiles, UpdateInfoFileTask } from "../publish/updateInfoBuilder"

export async function genYml(context: AfterPackContext, updateInfo: AsarUpdateInfo) {
  const info = {
    version: updateInfo.version,
    releaseDate: new Date().toISOString(),
    files: [
      {
        "url": path.basename(updateInfo.zipFilePath),
        "sha512": updateInfo.blockmapInfo.sha512,
        "size": updateInfo.blockmapInfo.size,
      }
    ],
    path: path.basename(updateInfo.zipFilePath),
    sha512: updateInfo.blockmapInfo.sha512,
  };

  const fileTasks: Array<UpdateInfoFileTask> = updateInfo.ymlPaths.map(ymlPath => {
    return {
      file: ymlPath,
      info: info,
      publishConfiguration: {
        provider: "generic",
        publishAutoUpdate: true,
      },
      packager: context.packager,
    }
  })
  await writeUpdateInfoFiles(fileTasks, context.packager as any);
}
