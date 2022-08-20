import { AsarUpdateInfo } from "./updateInfo";

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

export async function zipAsar(updateInfo: AsarUpdateInfo) {
	// e.g. //electron-updater-example/dist/linux-unpacked/resources
	const resourcesDir = path.join(updateInfo.appOutDir, 'resources');
	const output = fs.createWriteStream(updateInfo.zipFilePath);

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
