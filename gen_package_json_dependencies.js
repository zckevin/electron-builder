const { readdir } = require('fs/promises')

const getDirectories = async source =>
  (await readdir(source, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const db = new Map();

(async function () {
  const dir = require('path').resolve(__dirname, "./packages");
  const packages = await getDirectories(dir);

  packages.filter(p => p !== 'electron-updater').map(p => {
    const packageJson = require(`./packages/${p}/package.json`);
    console.log(packageJson.name, packageJson.dependencies);

    Object.entries(packageJson.dependencies).filter(([name, version]) => {
      return !version.includes('workspace:');
    }).forEach(([name, version]) => {
      if (!db.has(name)) {
        db.set(name, version);
      } else {
        if (version > db.get(name)) {
          db.set(key, version);
        }
      }
    });
  })

  for (const [name, version] of db) {
    console.log(`"${name}": "${version}",`);
  }
})()