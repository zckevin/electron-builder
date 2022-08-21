const path = require("path");
const appRoot = require("app-root-path");

// root is @zckevin/electron-builder
export const FIXTURES_DIR = path.join(appRoot.toString(), "test/fixtures");

export const YML_DUMMY_URL = new URL("https://example.com/update.yml");
export const PUBLISH_OPTIONS = {
  provider: 'generic',
  url: YML_DUMMY_URL.href,
}

class testFile {
  constructor(public version: string) { }

  public zipPath(): string {
    return path.join(FIXTURES_DIR, `electron-updater-example-${this.version}.asar.zip`);
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
