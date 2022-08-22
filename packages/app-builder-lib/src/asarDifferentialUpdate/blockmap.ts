import { AsarOutputInfo } from "./outputInfo";
import { executeAppBuilderAsJson } from "../util/appBuilder"

export async function genBlockMap(outputInfo: AsarOutputInfo) {
  const args = ["blockmap", "--input", outputInfo.zipFilePath, "--output", outputInfo.blockmapPath];
  const blockmapInfo = await executeAppBuilderAsJson(args);
  console.log("genBlockMap: exec args", args, ", result", blockmapInfo);
  outputInfo.setBlockmapInfo(blockmapInfo);
}
