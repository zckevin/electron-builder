const { spawn } = require('child_process');
const path = require('path');
const os = require("os");
const fetch = require('node-fetch');
const fs = require('fs');

// keep in sync with //global.ts
function getBinaryTarget() {
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

const binPath = path.join(__dirname, "../binary", `http-server-${getBinaryTarget().binarySuffix}`);
if (!fs.existsSync(binPath)) {
  throw new Error(`binary not found at ${binPath}`);
}
console.log("electron-update-example: binary path", binPath);

const goHttpServer = spawn(binPath);
const goHttpServerReadyPromise = new Promise((resolve, reject) => {
  goHttpServer.stdout.on('data', (data) => {
    resolve();
    console.log(`goHttpServer: stdout: ${data}`);
  });

  goHttpServer.stderr.on('data', (data) => {
    reject(data);
    console.log(`goHttpServer: stderr: ${data}`);
  });

  goHttpServer.on('close', (code) => {
    reject(new Error(`goHttpServer: exited with code ${code}`));
    console.log(`goHttpServer: child process exited with code ${code}`);
  });
});

async function goHttpServerGetVersion() {
  try {
    await goHttpServerReadyPromise;
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