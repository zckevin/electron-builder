import { combinations } from "object-boolean-combinations";
import * as fsExtra from 'fs-extra';
import * as _ from "lodash"
const path = require('path')
const AdmZip = require("adm-zip");

import { DIST_DIR, DEFAULT_BINARY_TARGETS } from "../global"
import { generateElectronProject } from "../electron-project-generator"
import { buildElectronAsar } from "../electron-project-builder"
import { createBuildTargetDir, readFilesInDir, UnitTestConfig, getDifferencialBuilderConfig, randomDirName } from "./helper";

// it may take some time to install/download Electron
const TIMEOUT = 5 * 60 * 1000;
const VERSION = '0.0.1'
const TEST_ROOT = path.join(DIST_DIR, randomDirName("unit"));
const APP_ROOT_DIR = path.join(TEST_ROOT, `app-root-${VERSION}`)

beforeAll(() => {
  fsExtra.ensureDirSync(TEST_ROOT)
  fsExtra.emptyDirSync(TEST_ROOT)
  generateElectronProject(VERSION, APP_ROOT_DIR);
})

function checkTargetZipFile(files: Array<string>, targetDir: string, config: UnitTestConfig) {
  const zipFileName = files.find((file: string) => file.endsWith('.asar.zip'));
  expect(zipFileName).toBeDefined();
  const zip = new AdmZip(path.join(targetDir, zipFileName));
  const filesInZip: string[] = zip.getEntries().map((entry: any) => entry.entryName);

  const asarEnabledRegex = new RegExp('app.asar$');
  const asarDisabledRegex = new RegExp('^resources/app/package.json$');
  const includesBinaryDirRegex = new RegExp('^resources/binary/http-server-');

  expect(filesInZip.filter((file: string) => asarEnabledRegex.test(file)).length).toBe(config.asar ? 1 : 0);
  expect(filesInZip.filter((file: string) => asarDisabledRegex.test(file)).length).toBe(config.asar ? 0 : 1);
  expect(filesInZip.filter((file: string) => includesBinaryDirRegex.test(file)).length).toBe(config.includesBinaryDir ? 1 : 0);
}

function checkTargetFiles(version: string, targetDir: string, config: UnitTestConfig) {
  // zip/yaml/blockmap
  const zipFileNames = config.includesBinaryDir ?
    DEFAULT_BINARY_TARGETS.map((target: any) => `electron-update-example-${version}-${target.os}-${target.arch}`) :
    [`electron-update-example-${version}`];
  const extensions = [".asar.zip", ".asar.zip.yml", ".asar.zip.blockmap"];
  const zipFiles = _.union(...zipFileNames.map(
    (fileName: string) => extensions.map((extension: string) => `${fileName}${extension}`)
  ));
  // index yaml
  const ymlFiles = config.includesBinaryDir ?
    DEFAULT_BINARY_TARGETS.map((target: any) => `asar-${target.os}-${target.arch}.yml`) :
    [`asar.yml`];
  const targetFilesShouldExist = _.union(zipFiles, ymlFiles);
  const files = readFilesInDir(targetDir);
  console.log(
    `checkTargetFiles: ${JSON.stringify(targetFilesShouldExist, null, 2)} ` +
    `should exist in ${JSON.stringify(files, null, 2)}`
  );
  targetFilesShouldExist.forEach((fileName: string) => {
    const regex = new RegExp(fileName);
    expect(files.find((file: string) => regex.test(file))).toMatch(regex);
  })
  checkTargetZipFile(files, targetDir, config);
}

const unitTestConfigs: UnitTestConfig[] = combinations({
  includesBinaryDir: [true, false],
  asar: [true, false],
}).map((config: any) => config as UnitTestConfig);

test.concurrent.each(unitTestConfigs)('`Differencial build should succceed with config: {%s}`', async (config) => {
  const dirName = _.keys(_.pickBy(config, _ => _)).join("_")
  const targetDir = createBuildTargetDir(TEST_ROOT, dirName);
  const {
    differencialBuilderConfig,
    electronBuilderConfig
  } = getDifferencialBuilderConfig(targetDir, APP_ROOT_DIR, config);
  await buildElectronAsar(electronBuilderConfig)
  checkTargetFiles(VERSION, differencialBuilderConfig.targetDir, config);
}, TIMEOUT);
