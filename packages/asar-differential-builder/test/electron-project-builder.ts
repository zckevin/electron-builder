import * as builder from 'electron-builder'
import * as _ from "lodash"
import { Platform, archFromString } from 'app-builder-lib'
import { ElectronBuilderConfig } from "./electron-builder-config"
import { BinaryTarget, getBinaryTarget, NodeGolangPlatformTransform } from './global';
import { addUpdateYmlToResourcesDir } from "./afterpack-hook"

export let DEFAULT_PLATFORM: Platform;

export function getElectronPlatform(target: BinaryTarget): Platform {
  switch (target.os) {
    case "darwin":
      return builder.Platform.MAC;
    case "linux":
      return builder.Platform.LINUX;
    case "windows":
      return builder.Platform.WINDOWS;
    default:
      throw new Error(`Unknown os: ${target.os}`);
  }
}

export async function buildElectronAsar(config: ElectronBuilderConfig) {
  const target = getBinaryTarget();
  const args: any = {
    config: config.config,
    targets: getElectronPlatform(target).createTarget(),
  }
  console.log(`Build electron asar with config: \n`, config)
  await builder.build(args)
    .catch((error: any) => {
      throw error;
    })
}

export async function buildElectronFull(config: ElectronBuilderConfig, target: BinaryTarget) {
  const args: any = {
    config: {
      afterPack: addUpdateYmlToResourcesDir,
      ..._.omit(config.config, "afterPack"),
    },
    targets: getElectronPlatform(target).createTarget(
      "dir",
      archFromString(NodeGolangPlatformTransform(target.arch))
    ),
  }
  console.log(`Build electron full with config: \n`, args)
  await builder.build(args)
    .catch((error: any) => {
      throw error;
    })
}
