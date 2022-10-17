import { executeAppBuilder } from "builder-util"
import { AppInfo, BuilderConfig } from "./config";

function executeAppBuilderAsJson<T>(args: Array<string>): Promise<T> {
  return executeAppBuilder(args).then(rawResult => {
    if (rawResult === "") {
      return Object.create(null) as T
    }

    try {
      return JSON.parse(rawResult) as T
    } catch (e: any) {
      throw new Error(`Cannot parse result: ${e.message}: "${rawResult}"`)
    }
  })
}

export async function genBlockMap(appinfo: AppInfo, config: BuilderConfig, zipPath: string) {
  // blockmap should be put with zip in exact same directory
  const blockmapPath = zipPath + ".blockmap";
  const args = [ "blockmap", "--input", zipPath, "--output", blockmapPath ];
  const blockmapInfo = await executeAppBuilderAsJson(args);
  console.log("genBlockMap: exec args", args, ", result", blockmapInfo);
  return blockmapInfo
}
