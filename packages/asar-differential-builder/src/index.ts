import { AfterPackContext } from "app-builder-lib"
import { genZip } from "./zip"
import { genBlockMap } from "./blockmap";
import { genYml } from "./yml";
import { AppInfo, BuilderConfig } from "./config";
import { BinaryTarget } from "./binary";
import { backupUnpackedProject, addUpdateYmlToResourcesDir } from "../test/afterpack-hook"

export async function generateDifferentialUpdate(
  context: AfterPackContext | null,
  config: BuilderConfig,
  name: string,
  version: string,
  unpackedDir: string,
) {
  const appInfo = new AppInfo(name, version, unpackedDir, config)

  const run = async (binaryTarget: BinaryTarget | null) => {
    const zipPath = await genZip(appInfo, config, binaryTarget);
    const blockmapInfo = await genBlockMap(appInfo, config, zipPath);
    await genYml(appInfo, config, binaryTarget, zipPath, blockmapInfo);
    await addUpdateYmlToResourcesDir(context!)

    if (config.testingOptions.backupUnpackedAppRoot) {
      await backupUnpackedProject(context!)
    }
  }

  try {
    if (config.includesBinaryDir) {
      await Promise.all(appInfo.binaryTargets!.map(run))
    } else {
      await run(null)
    }
  } catch (e) {
    console.error(e)
  }
}

export type AfterPackCallback = (context: AfterPackContext) => Promise<void>;

export function afterPackWithConfig(config: BuilderConfig): AfterPackCallback {
  return async (context: AfterPackContext) => {
    const { name, version } = context.packager.appInfo;
    const unpackedDir = context.appOutDir;
    await generateDifferentialUpdate(context, config, name, version, unpackedDir);
  }
}