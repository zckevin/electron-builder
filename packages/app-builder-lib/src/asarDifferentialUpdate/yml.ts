const path = require('path');
import { AfterPackContext } from "../index"
import { AsarOutputInfo } from "./outputInfo";
import { writeUpdateInfoFiles, UpdateInfoFileTask } from "../publish/updateInfoBuilder"

export async function genYml(context: AfterPackContext, outputInfo: AsarOutputInfo) {
  const info = {
    version: outputInfo.version,
    releaseDate: new Date().toISOString(),
    files: [
      {
        "url": path.basename(outputInfo.zipFilePath),
        "sha512": outputInfo.blockmapInfo.sha512,
        "size": outputInfo.blockmapInfo.size,
      }
    ],
    path: path.basename(outputInfo.zipFilePath),
    sha512: outputInfo.blockmapInfo.sha512,
  };

  const fileTasks: Array<UpdateInfoFileTask> = outputInfo.ymlPaths.map(ymlPath => {
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
