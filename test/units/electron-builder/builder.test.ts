import * as builder from 'electron-builder'
import { basicConfig } from "./config"
import { platform } from './helper';
import { TEST_ROOT_DIR } from "../../global"
const fsExtra = require('fs-extra');
const path = require('path')

// it may take some time to install/download Electron
const timeout = 15 * 1000;

beforeEach(async () => {
  const distDir = path.join(TEST_ROOT_DIR, "dist");
  console.log(`Clean dist dir: ${distDir}`);
  fsExtra.emptyDirSync(path.join(TEST_ROOT_DIR, "dist"));
})

test("Builder should succceed on build unpacked project", async () => {
  const args = {
    targets: platform.createTarget(),
    config: basicConfig
  };
  await builder.build(args as any)
    .catch((error: any) => {
      throw error;
    })
}, timeout)

test("Builder should succceed on build unpacked project with differentialAsarZip", async () => {
  const config = {
    differentialAsarZip: true,
    ...basicConfig,
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
