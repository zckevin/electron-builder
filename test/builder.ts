import { TEST_ROOT_DIR, getBinaryInfo } from "./global";

const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra')

const DEMO_PROJECT_ROOT = path.join(TEST_ROOT_DIR, "electron-update-example")

class GoBuilder {
  private goFileName = "http-server"
  private goFilePath = path.join(DEMO_PROJECT_ROOT, `${this.goFileName}.go`)

  build(version: string, destDir: string) {
    const {binarySuffix, os, arch} = getBinaryInfo()
    const goBinaryName = `${this.goFileName}-${binarySuffix}`
    const destPath = path.join(destDir, goBinaryName)
    const cmd = `env GOOS=${os} GOARCH=${arch} ` +
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
  build(version: string, destDir: string) {
    const source = `module.exports = {version: "${version}"}`
    const destPath = path.join(destDir, `version.js`)
    console.log(`JSBuilder: write ${destPath}`)
    fs.writeFileSync(destPath, source)
  }
}

class PackageJsonBuilder {
  build(version: string, destDir: string) {
    const filePath = path.join(DEMO_PROJECT_ROOT, "package.json")
    const obj = require(filePath) as any
    obj.version = version
    const destPath = path.join(destDir, "package.json")
    console.log(`PackageJsonBuilder: write ${destPath}`)
    fs.writeFileSync(destPath, JSON.stringify(obj))
  }
}

class FileCopier {
  private srcFiles = [
    "main.js",
    "real-main.js",
    "promises.js",
    "binary.js",
    "updater.js",
    "version.html",
    "node_modules/",
  ]

  build(destDir: string) {
    for (const srcFile of this.srcFiles) {
      const srcPath = path.join(DEMO_PROJECT_ROOT, srcFile)
      const destPath = path.join(destDir, srcFile)
      console.log(`FileCopier: copy ${srcPath} to ${destPath}`)
      fsExtra.copySync(srcPath, destPath)
    }
  }
}

export function generateElectronProject(version: string, destDir: string) {
  const goBuilder = new GoBuilder()
  const jsBuilder = new JSBuilder()
  const packageJsonBuilder = new PackageJsonBuilder()
  const fileCopier = new FileCopier()

  goBuilder.build(version, destDir)
  jsBuilder.build(version, destDir)
  packageJsonBuilder.build(version, destDir)
  fileCopier.build(destDir)
}

export function clean(dir: string) {
  // TODO: check rm is safe
  // shell.rm('-rf', `${dir}/*`)
}
