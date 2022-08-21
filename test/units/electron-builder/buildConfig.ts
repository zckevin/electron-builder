const path = require('path');

const basicConfig = {
  "appId": "com.github.iffy.electronupdaterexample",
  /*
  "mac": {
    "category": "your.app.category.type",
    "target": [
      "zip"
    ],
    "asar": true,
    "publish": [
      {
        "provider": "generic",
        "url": "http://example.com/"
      }
    ],
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "entitlements.mac.plist",
    "entitlementsInherit": "entitlements.mac.plist"
  },
  "win": {
    "target": "nsis",
    "asar": false,
    "publish": [
      {
        "provider": "generic",
        "url": "https://example.com"
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "deleteAppDataOnUninstall": true,
    "warningsAsErrors": false,
    "allowToChangeInstallationDirectory": true,
    "menuCategory": true,
    "allowElevation": true
  },
  */
  "linux": {
    "category": "your.app.category.type",
    "target": "dir",
    "asar": false
  },
  "extraResources": [
    "./binary/**"
  ],

  directories: {
    output: "dist",
    app: path.join(__dirname, "../../electron-update-example"),
  },
  files: [
  ],
}

export default basicConfig;