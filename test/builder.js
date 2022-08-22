const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra')
const { getGoBinaryInfo } = require("./electron-update-example/binary-info.js")

const demoDirName = "electron-update-example"

class GoBuilder {
  constructor() {
    const { operatingSystem, arch, name } = getGoBinaryInfo()
    this.os = operatingSystem;
    this.arch = arch;
    this.name = name
    this.goFilePath = path.join(__dirname, demoDirName, "http-server.go")
  }

  build(version, rootDir) {
    const destPath = path.join(rootDir, this.name)
    const cmd = `env GOOS=${this.os} GOARCH=${this.arch} ` +
      `go build -ldflags "-s -w -X main.version=${version}" ` +
      `-o ${destPath} ${this.goFilePath}`
    console.log(`GoBuilder: ${cmd}`)
    const ret = shell.exec(cmd)
    if (ret.code !== 0) {
      console.log(ret.stdout)
      console.log(ret.stderr)
      throw new Error("GoBuilder: exec error")
    }
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
      "real-main.js",
      "promises.js",
      "binary.js",
      "binary-info.js",
      "updater.js",
      "version.html",
      "node_modules/",
    ]
  }

  build(rootDir) {
    for (const srcFile of this.srcFiles) {
      const srcPath = path.join(__dirname, demoDirName, srcFile)
      const destPath = path.join(rootDir, srcFile)
      console.log(`FileCopier: copy ${srcPath} to ${destPath}`)
      fsExtra.copySync(srcPath, destPath)
    }
  }
}

function generateElectronProject(version, rootDir) {
  const goBuilder = new GoBuilder()
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
  generateElectronProject,
  clean,
}