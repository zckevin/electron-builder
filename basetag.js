const fsExtra = require("fs-extra");
const shelljs = require("shelljs")

fsExtra.ensureDirSync("node_modules");
shelljs.exec("npm run basetag");
