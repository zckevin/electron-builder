import { OLD_FILE, NEW_FILE } from "./config"
const fs = require("fs");

export function createHTTPExecutorMock(): any {
  return {
    createRequest: jest.fn().mockImplementation((options, callback) => {
      const rangeHeader = options.headers!.range;
      const regex = /bytes=(\d+)-(\d+)/;
      const captured = regex.exec(rangeHeader);
      if (captured == null) {
        throw new Error(`Cannot parse range header: ${rangeHeader}`);
      }
      const start = parseInt(captured[1]);
      const end = parseInt(captured[2]);

      let filePath: string;
      if (options.path.includes(OLD_FILE.version)) {
        filePath = OLD_FILE.zipPath();
      } else if (options.path.includes(NEW_FILE.version)) {
        filePath = NEW_FILE.zipPath();
      } else {
        throw new Error("Unknown version");
      }
      const resp = fs.createReadStream(filePath, {
        start,
        end,
      });
      resp.statusCode = 200;

      return {
        on: jest.fn(),
        abort: jest.fn(),
        end: jest.fn(() => {
          callback(resp);
        }),
      };
    }),

    download: jest.fn().mockImplementation(async (url: URL, destination: string): Promise<string> => {
      if (!destination.includes(NEW_FILE.version)) {
        throw new Error("Invalid destination");
      }
      return new Promise((resolve, reject) => {
        fs.copyFile(NEW_FILE.zipPath(), destination, (err: any) => {
          if (err) throw err;
          resolve(destination);
        });
      })
    }),

    addErrorAndTimeoutHandlers: jest.fn(),
  }
}

