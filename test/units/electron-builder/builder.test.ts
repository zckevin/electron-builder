import * as builder from 'electron-builder'
const fsExtra = require('fs-extra');
const path = require('path')

import { BuildConfig } from "./config"
import { platform } from './helper';
import { DIST_DIR } from "../../global"
const { generateElectronProject } = require("../../builder.js");

// it may take some time to install/download Electron
const timeout = 60 * 1000;
const version = '0.0.1'
const rootDir = path.join(DIST_DIR, `builder-root-${version}`)

beforeEach(() => {
  fsExtra.ensureDirSync(DIST_DIR)
  fsExtra.emptyDirSync(DIST_DIR)
})

test("Builder should succceed on build unpacked project", async () => {
  generateElectronProject(version, rootDir)

  const args = {
    targets: platform.createTarget(),
    config: new BuildConfig(rootDir).config,
  };
  await builder.build(args as any)
    .catch((error: any) => {
      throw error;
    })
}, timeout)

test("Builder should succceed on build unpacked project with differentialAsarZip", async () => {
  generateElectronProject(version, rootDir)

  const args = {
    targets: platform.createTarget(),
    config: new BuildConfig(rootDir)
      .withDifferentialAsar(true)
      .withLinkElectronUpdaterToOutDir(true)
      .config,
  };
  await builder.build(args as any)
    .catch((error: any) => {
      throw error;
    })
}, timeout)