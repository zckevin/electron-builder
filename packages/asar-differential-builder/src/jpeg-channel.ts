// @ts-ignore
import { UploadFile, SinkType } from "@zckevin/jpeg-file";
const fs = require('fs');

export class JpegChannelOptions {
  public chunkSize = 512 * 1024
  public concurrency = 10
  public doValidate = true
  public sinkType = SinkType.tmpfile
  public maskPhotoFilePath = ""
  public usedBitsString = ""
}

export async function JpegChannelUpload(
  filePath: string,
  config: JpegChannelOptions 
) {
  const f = new UploadFile(
    filePath,
    config.chunkSize,
    config.concurrency,
    config.doValidate,
    fs,
    config.sinkType,
    config.maskPhotoFilePath,
    config.usedBitsString,
  );
  const descStr = await f.GenerateDescription();
  return descStr;
}