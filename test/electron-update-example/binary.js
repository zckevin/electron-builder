const { spawn } = require('child_process');
const path = require('path');
const log = require('electron-log');

// __dirname is `//asar-unpacked/`
// with "extraResources": [ "./binary/**" ] in package.json,
// we need to go up one level to get the path of the binary folder

let binPath = path.join(__dirname, '../binary/hello');
if (process.platform === 'win32') {
  binPath += '.exe';
} else if (process.platform === 'darwin') {
  binPath += '.app';
}

log.info("electron-update-example: binary path", binPath);

const hello = spawn(binPath);

hello.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

hello.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

hello.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

