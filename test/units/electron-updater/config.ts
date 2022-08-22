import { TEST_ROOT_DIR } from "../../global"
const path = require("path");

export const FIXTURES_DIR = path.join(TEST_ROOT_DIR, "fixtures");

export const YML_DUMMY_URL = new URL("https://example.com/update.yml");
export const PUBLISH_OPTIONS = {
  provider: 'generic',
  url: YML_DUMMY_URL.href,
}

class testFile {
  constructor(public version: string) { }

  public zipPath(): string {
    return path.join(FIXTURES_DIR, `electron-update-example-${this.version}.asar.zip`);
  }

  public blockmapPath(): string {
    return this.zipPath() + ".blockmap";
  }

  public ymlPath(): string {
    return this.zipPath() + ".yml";
  }
}

export const OLD_FILE = new testFile("0.9.25");
export const NEW_FILE = new testFile("0.9.26");
