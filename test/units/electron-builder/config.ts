const path = require('path');

const platformConfig = {
  "asar": false,
  "target": "dir",
}

export const basicConfig = {
  appId: "com.github.iffy.electronupdaterexample",

  directories: {
    output: "dist",
    app: path.join(__dirname, "../../electron-update-example"),
  },
  extraResources: [
    "./binary/**"
  ],
  files: [],

  linux: platformConfig,
  win: platformConfig,
  mac: platformConfig,
}
