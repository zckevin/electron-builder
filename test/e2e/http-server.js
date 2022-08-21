const static = require('node-static');

const serverPort = 12000;

async function createStaticServer(path) {
  const fileServer = new static.Server(path);

  const server = require('http').createServer(function (request, response) {
    request.addListener('end', function () {
      fileServer.serve(request, response);
    }).resume();
  }).listen(serverPort);

  return new Promise((resolve, reject) => {
    server.on("listening", () => {
      resolve(server);
    })

    server.on("error", (err) => {
      console.error("http-server:", err);
    })
  })
}

module.exports = {
  createStaticServer,
  serverPort,
};