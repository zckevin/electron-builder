import { TEST_ROOT_DIR } from "../../global";
const path = require('path');

const platformConfig = {
  "asar": false,
  "target": "dir",
}

export const basicConfig = {
  appId: "com.github.iffy.electronupdaterexample",
  directories: {
    output: "dist",
    app: path.join(TEST_ROOT_DIR, "electron-update-example"),
  },
  linux: platformConfig,
  win: platformConfig,
  mac: platformConfig,
}

export function getConfig(rootDir: string) {
  return {
    appId: "com.github.iffy.electronupdaterexample",
    directories: {
      output: "dist",
      // app: path.join(TEST_ROOT_DIR, "electron-update-example"),
      app: rootDir,
    },
    linux: platformConfig,
    win: platformConfig,
    mac: platformConfig,
  }
}
