const { spawn } = require('child_process');
const path = require('path');
const log = require('electron-log');
const fetch = require('node-fetch');
const { getGoBinaryInfo } = require("./binary-info.js")

const goHttpServerApi = 'http://localhost:10086/version'

const binPath = path.join(__dirname, getGoBinaryInfo().name);
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
  getGoBinaryInfo,
  goHttpServer,
  goHttpServerGetVersion,
}