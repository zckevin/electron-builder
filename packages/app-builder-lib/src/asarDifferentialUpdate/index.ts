import { AfterPackContext } from "../index"
import { AsarOutputInfo } from "./outputInfo"
import { zipAsar } from "./zip"
import { genBlockMap } from "./blockmap";
import { genYml } from "./yml";

export async function generateDifferentialUpdate(context: AfterPackContext) {
  const name = context.packager.appInfo.sanitizedName;
  const version = context.packager.appInfo.version;
  const outputInfo = new AsarOutputInfo(name, version, context.outDir, context.appOutDir);

  await zipAsar(outputInfo);
  await genBlockMap(outputInfo);
  await genYml(context, outputInfo);
}
