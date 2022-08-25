const _ = require('lodash');
const fsExtra = require('fs-extra')
const path = require('path')
const shelljs = require('shelljs');

const packageJsonFile = path.join(__dirname, 'package.json')
const packageJsonFileBackup = path.join(__dirname, 'package.json.backup')
const packageJsonPublishFile = path.join(__dirname, 'package-publish.json')

const publishPackageJsonContents = _.merge(require(packageJsonFile), require(packageJsonPublishFile))
console.log(publishPackageJsonContents)

fsExtra.moveSync(packageJsonFile, packageJsonFileBackup, { overwrite: true })
fsExtra.writeFileSync(packageJsonFile, JSON.stringify(publishPackageJsonContents, null, 2))

shelljs.exec("npm publish --no-git-checks --access public");

fsExtra.moveSync(packageJsonFileBackup, packageJsonFile, { overwrite: true })
