import * as builder from 'electron-builder'
import { getConfig } from "./config"
import { platform } from './helper';
import { DIST_DIR } from "../../global"
const { buildElectronProject } = require("../../builder.js");
const fsExtra = require('fs-extra');
const path = require('path')

// it may take some time to install/download Electron
const timeout = 20 * 1000;
const version = '0.0.1'
const rootDir = path.join(DIST_DIR, `builder-root-${version}`)

beforeEach(() => {
  fsExtra.ensureDirSync(DIST_DIR)
  fsExtra.emptyDirSync(DIST_DIR)
})

test("Builder should succceed on build unpacked project", async () => {
  buildElectronProject(version, rootDir)

  const args = {
    targets: platform.createTarget(),
    config: getConfig(rootDir),
  };
  await builder.build(args as any)
    .catch((error: any) => {
      throw error;
    })
}, timeout)

test("Builder should succceed on build unpacked project with differentialAsarZip", async () => {
  buildElectronProject(version, rootDir)

  const config = {
    differentialAsarZip: true,
    ...getConfig(rootDir),
  }
  const args = {
    targets: platform.createTarget(),
    config,
  };
  await builder.build(args as any)
    .catch((error: any) => {
      throw error;
    })
}, timeout)