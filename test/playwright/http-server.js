const httpServer = require('http-server')
const serverPort = 10087;

async function createStaticServer(root) {
  const fileServer = httpServer.createServer({ root })
  fileServer.listen(serverPort)
  return fileServer
}

module.exports = {
  createStaticServer,
  serverPort,
};