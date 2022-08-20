import { AsarUpdateInfo } from "./updateInfo";
import { executeAppBuilderAsJson } from "../util/appBuilder"

export async function genBlockMap(updateInfo: AsarUpdateInfo) {
  const args = ["blockmap", "--input", updateInfo.zipFilePath, "--output", updateInfo.blockmapPath];
  const blockmapInfo = await executeAppBuilderAsJson(args);
  console.log("genBlockMap: exec args", args, ", result", blockmapInfo);
  updateInfo.setBlockmapInfo(blockmapInfo);
}
