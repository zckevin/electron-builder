const { spawn } = require('child_process');
const path = require('path');
const os = require("os");
const log = require('electron-log');
const fetch = require('node-fetch');

function getBinaryInfo() {
  let arch = os.arch();
  let operatingSystem = os.platform();

  // special name mapping from Node -> Go
  switch (arch) {
    case "x64":
      arch = "amd64";
      break;
    case "ia32":
      arch = "386";
      break;
  }
  switch (operatingSystem) {
    case "win32":
      operatingSystem = "windows";
      break;
  }

  // windows need .exe as binary suffix
  const suffix = (operatingSystem === "windows") ? ".exe" : "";

  return {
    binarySuffix: `${operatingSystem}-${arch}${suffix}`,
    os: operatingSystem,
    arch,
  }
}

const goHttpServerApi = 'http://localhost:10086/version'

const binPath = path.join(__dirname, `http-server-${getBinaryInfo().binarySuffix}`);
log.info("electron-update-example: binary path", binPath);

const goHttpServer = spawn(binPath);

goHttpServer.stdout.on('data', (data) => {
  log.info(`goHttpServer: stdout: ${data}`);
});

goHttpServer.stderr.on('data', (data) => {
  log.info(`goHttpServer: stderr: ${data}`);
});

goHttpServer.on('close', (code) => {
  log.info(`goHttpServer: child process exited with code ${code}`);
});

async function goHttpServerGetVersion() {
  try {
    const response = await fetch(goHttpServerApi);
    return await response.text();
  } catch (err) {
    return err;
  }
}

module.exports = {
  goHttpServer,
  goHttpServerGetVersion,
}