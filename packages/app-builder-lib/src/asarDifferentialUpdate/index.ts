import { copyDir } from "builder-util/out/fs"
import * as path from "path";
import { AfterPackContext } from "../index"
import { AsarUpdateInfo } from "./updateInfo"
import { zipAsar } from "./zip"
import { genBlockMap } from "./blockmap";
import { genYml } from "./yml";

async function renameLinuxUnpacked(dir: string, updateInfo: AsarUpdateInfo) {
  await copyDir(dir, path.join(dir, `../linux-unpacked-${updateInfo.version}`))
}

export async function generateDifferentialUpdate(context: AfterPackContext) {
  const name = context.packager.appInfo.sanitizedName;
  const version = context.packager.appInfo.version;
  const updateInfo = new AsarUpdateInfo(name, version, context.outDir, context.appOutDir);

  await zipAsar(updateInfo);
  await genBlockMap(updateInfo);
  await genYml(context, updateInfo);

  await renameLinuxUnpacked(updateInfo.appOutDir, updateInfo);
}
