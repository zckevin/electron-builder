import * as fsExtra from 'fs-extra';
import * as _ from "lodash"
const path = require('path')
const fs = require("fs");
const yaml = require('js-yaml');

import { ElectronBuilderConfig } from "../electron-builder-config"
import { DIST_DIR } from "../global"
import { generateElectronProject } from "../electron-project-generator"
import { buildElectronAsar } from "../electron-project-builder"
import { createBuildTargetDir, getFilePathByRegex, getDifferencialBuilderConfig, randomDirName } from "./helper";

jest.setTimeout(60 * 1000);

const TEST_ROOT = path.join(DIST_DIR, randomDirName("unit"));
const versions = ['0.0.1', '0.0.2'];
let appRoots: string[] = [];

beforeAll(() => {
  fsExtra.ensureDirSync(TEST_ROOT)
  fsExtra.emptyDirSync(TEST_ROOT)
  appRoots = versions.map((version: string) => {
    const appRoot = path.join(TEST_ROOT, `app-root-${version}`)
    generateElectronProject(version, appRoot);
    return appRoot;
  });
})

const unitTestConfig = {
  includesBinaryDir: false,
  asar: true,
}

function getFilesInYaml(targetDir: string, builderConfig: ElectronBuilderConfig): any[] {
  const channel = builderConfig.differentialBuilderConfig!.channel;
  const ymlFileRegex = new RegExp(`^${channel}.*\.yml$`);
  const ymlFilePath = getFilePathByRegex(targetDir, ymlFileRegex);
  const indexYml = yaml.load(fs.readFileSync(ymlFilePath, "utf-8"));
  return indexYml.files;
}

test('Index yml file should have two files with build version update', async () => {
  const dirName = "yml-test"
  const targetDir = createBuildTargetDir(TEST_ROOT, dirName);
  // version 0.0.1
  {
    const { electronBuilderConfig } = getDifferencialBuilderConfig(targetDir, appRoots[0], unitTestConfig);
    await buildElectronAsar(electronBuilderConfig)

    const ymlFiles = getFilesInYaml(targetDir, electronBuilderConfig);
    expect(ymlFiles.length).toBe(1);
  }
  // version 0.0.2
  {
    const { electronBuilderConfig } = getDifferencialBuilderConfig(targetDir, appRoots[1], unitTestConfig);
    await buildElectronAsar(electronBuilderConfig)

    const ymlFiles = getFilesInYaml(targetDir, electronBuilderConfig);
    expect(ymlFiles.length).toBe(2);
  }
})

test('Index yml file should have only one file with same version rebuild', async () => {
  const dirName = "yml-test"
  const targetDir = createBuildTargetDir(TEST_ROOT, dirName);
  // version 0.0.1
  {
    const { electronBuilderConfig } = getDifferencialBuilderConfig(targetDir, appRoots[0], unitTestConfig);
    await buildElectronAsar(electronBuilderConfig)

    const ymlFiles = getFilesInYaml(targetDir, electronBuilderConfig);
    expect(ymlFiles.length).toBe(1);
  }
  // version 0.0.1 again
  {
    const { electronBuilderConfig } = getDifferencialBuilderConfig(targetDir, appRoots[0], unitTestConfig);
    await buildElectronAsar(electronBuilderConfig)

    const ymlFiles = getFilesInYaml(targetDir, electronBuilderConfig);
    expect(ymlFiles.length).toBe(1);
  }
})