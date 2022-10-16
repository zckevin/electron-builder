import { Writable } from "stream"
import { copyData, } from "./DataSplitter"
import { DifferentialDownloader } from "./DifferentialDownloader"
import { Operation, OperationKind } from "./downloadPlanBuilder"
import * as rx from "rxjs";

const { DownloadFile } = require("@zckevin/jpeg-file");

export async function downloadUsingJpegChannel(
  descStr: string,
  differentialDownloader: DifferentialDownloader,
  tasks: Array<Operation>,
  out: Writable,
  oldFileFd: number,
  reject: (error: Error) => void
) {
  const readRequests = tasks.filter(it => it.kind === OperationKind.DOWNLOAD);
  const df = await DownloadFile.Create(descStr, 10);
  const blockingQueue = df.ReadvBlockingQueue(readRequests);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const subject = new rx.ReplaySubject();
    const onError = (err: any) => {
      subject.error(err);
      subject.complete();
    };
    const onResolve = () => {
      subject.next(null);
      subject.complete();
    }
    if (task.kind === OperationKind.COPY) {
      copyData(task, out, oldFileFd, onError, onResolve);
    } else {
      try {
        const buf = await blockingQueue.blpop();
        out.write(buf, (err) => {
          if (err) {
            onError(err);
          } else {
            onResolve();
          }
        });
      } catch (err) {
        onError(err);
      }
    }

    try {
      await rx.firstValueFrom(subject);
    } catch(err) {
      reject(err as Error);
      return;
    }
  }

  if (differentialDownloader.fileMetadataBuffer != null) {
    out.write(differentialDownloader.fileMetadataBuffer)
  }
  out.end()
}
