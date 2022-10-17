import * as builder from 'electron-builder'
import * as _ from "lodash"
import { ElectronBuilderConfig } from "../test/electron-builder-config"
import { getElectronPlatform } from "../test/electron-project-builder"
import { getBinaryTarget } from "../test/global"
import { BuilderConfig } from '../src/config';
import { JpegChannelOptions } from '../src/jpeg-channel';
// @ts-ignore
import { SinkType } from "@zckevin/jpeg-file";

const appRoot = "/home/zc/PROJECTS/vipninja/frontend-monorepo/packages/Fifo-Browser";
const targetDir = "/tmp/fifo";

function getAsarBuildArgs() {
  const jpegChannelOptions = new JpegChannelOptions();
  jpegChannelOptions.sinkType = SinkType.bilibili;

  const differencialBuilderConfig = new BuilderConfig(targetDir);
  differencialBuilderConfig.useJpegChannel = true;
  differencialBuilderConfig.jpegChannelOptions = jpegChannelOptions;
  differencialBuilderConfig.zipLevel = 1;

  const electronBuilderConfig =
    new ElectronBuilderConfig(appRoot)
      .withOutputDir(differencialBuilderConfig.targetDir)
      .withDifferentialBuilderConfig(differencialBuilderConfig)
      .withBinaryDir(true)
      .withAsar(true)
  const config = _.merge(electronBuilderConfig.config, {
    appId: "fifo",
    files: [
      "build/**/*",
      "static/**/*",
      "package.json",
      // in case electron being packed into zip
      "!node_modules/electron/**/*",
    ],
  });
  return {
    config,
    targets: getElectronPlatform(getBinaryTarget()).createTarget(),
  }
}

function getFullBuildArgs() {
  const config = getAsarBuildArgs().config;
  delete config.afterPack;
  ["linux", "win", "mac"].forEach((platform) => {
    config[platform].target = "zip";
  })
  return {
    config,
    targets: getElectronPlatform(getBinaryTarget()).createTarget(),
  }
}

async function build(asar: boolean = true) {
  const args = asar ? getAsarBuildArgs() : getFullBuildArgs();
  console.log(args);
  await builder.build(args).catch((error: any) => {
    console.error(error)
  })
}

async function run() {
  await build(false);
  // await build(true);
}

run();