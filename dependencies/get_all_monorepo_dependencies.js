const path = require("path");
const { readdir } = require('fs/promises');
const fs = require("fs");
const { appendElectron } = require("./electron.js")

const db = new Map();
const packagesDir = path.join(__dirname, "../packages")

async function getDirectories(source) {
  return (await readdir(source, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

async function run() {
  (await getDirectories(packagesDir))
    .filter(p => p !== 'electron-updater')
    .map(p => {
      const packageJson = require(path.join(packagesDir, `${p}/package.json`));
      console.log(packageJson.name, packageJson.dependencies);

      Object.entries(packageJson.dependencies).filter(([name, version]) => {
        return !version.includes('workspace:');
      }).forEach(([name, version]) => {
        if (!db.has(name)) {
          db.set(name, version);
        } else {
          if (version !== db.get(name)) {
            // db.set(key, version);
            console.error(`unmatched dependency version for [${name}]@${p}:`, db.get(name), version)
            process.exit()
          }
        }
      });
    })
  for (const [name, version] of db) {
    console.log(`"${name}": "${version}",`);
  }
}

function writePackageJson() {
  const packageJson = require("./package.template.json")
  packageJson.dependencies = appendElectron(Object.fromEntries(db))
  packageJson.version = require("../package.json").version
  fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2))
}

run().then(() => {
  writePackageJson()
})