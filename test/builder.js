const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra')
const os = require('os')

const demoDirName = "electron-update-example"

class GoBuilder {
  constructor(os, arch) {
    this.os = os;
    this.arch = arch;
    this.goFilePath = path.join(__dirname, demoDirName, "http-server.go")
  }

  build(version, rootDir) {
    const destPath = path.join(rootDir, `http-server-${this.os}-${this.arch}`)
    const cmd = `env GOOS=${this.os} GOARCH=${this.arch} ` +
      `go build -ldflags "-s -w -X main.version=${version}" ` +
      `-o ${destPath} ${this.goFilePath}`
    console.log(`GoBuilder: ${cmd}`)
    shell.exec(cmd)
  }
}

class JSBuilder {
  build(version, rootDir) {
    const source = `module.exports = {version: "${version}"}`
    const destPath = path.join(rootDir, `version.js`)
    console.log(`JSBuilder: write ${destPath}`)
    fs.writeFileSync(destPath, source)
  }
}

class PackageJsonBuilder {
  build(version, rootDir) {
    const filePath = path.join(__dirname, demoDirName, "package.json")
    const obj = require(filePath)
    obj.version = version
    const destPath = path.join(rootDir, "package.json")
    console.log(`PackageJsonBuilder: write ${destPath}`)
    fs.writeFileSync(destPath, JSON.stringify(obj))
  }
}

class FileCopier {
  constructor() {
    this.srcFiles = [
      "main.js",
      "binary.js",
      "updater.js",
      "node_modules/",
    ]
  }

  build(rootDir) {
    for (const srcFile of this.srcFiles) {
      const srcPath = path.join(__dirname, demoDirName, srcFile)
      const destPath = path.join(rootDir, srcFile)
      console.log(`FileCopier: copy ${srcFile} to ${destPath}`)
      fsExtra.copySync(srcPath, destPath)
    }
  }
}

function buildElectronProject(version, rootDir) {
  let arch = os.arch();
  let operatingSystem = os.platform();
  // name mapping from Node -> Go
  switch(arch) {
    case "x64":
      arch = "amd64";
      break;
    case "ia32":
      arch = "386";
      break;
  }
  switch(operatingSystem) {
    case "win32":
      operatingSystem = "windows";
      break;
  }
  const goBuilder = new GoBuilder(operatingSystem, arch)
  const jsBuilder = new JSBuilder()
  const packageJsonBuilder = new PackageJsonBuilder()
  const fileCopier = new FileCopier()

  goBuilder.build(version, rootDir)
  jsBuilder.build(version, rootDir)
  packageJsonBuilder.build(version, rootDir)
  fileCopier.build(rootDir)
}

function clean(dir) {
  // TODO: check rm is safe
  // shell.rm('-rf', `${dir}/*`)
}

module.exports = {
  buildElectronProject,
  clean,
}