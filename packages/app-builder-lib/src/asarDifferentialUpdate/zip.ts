import { AsarOutputInfo } from "./outputInfo";

const fs = require('fs');
const archiver = require('archiver');

export async function zipAsar(outputInfo: AsarOutputInfo) {
  const resourcesDir = outputInfo.resourcesDir;
  const output = fs.createWriteStream(outputInfo.zipFilePath);

  const archive = archiver('zip', {
    zlib: { level: 1 } // fastest
  });

  return new Promise((resolve, reject) => {
    output.on('close', function () {
      console.log("zipAsar: archive finalized, add ", archive.pointer() + ' total bytes');
      resolve(null)
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err: any) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    archive.on('error', function (err: any) {
      reject(err);
    });

    archive.pipe(output);

    archive.directory(resourcesDir, 'resources');
    archive.finalize();
  })
}
