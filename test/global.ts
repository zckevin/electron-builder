const path = require("path");
const appRoot = require("app-root-path");

// appRoot is @zckevin/electron-builder
export const TEST_ROOT_DIR = path.join(appRoot.toString(), "test");
export const DIST_DIR = path.join(TEST_ROOT_DIR, "dist");
export const FIXTURES_DIR = path.join(TEST_ROOT_DIR, "fixtures");

export const YML_DUMMY_URL = new URL("https://example.com/update.yml");

export const PUBLISH_OPTIONS = {
  provider: 'generic',
  url: YML_DUMMY_URL.href,
}

class FixtureFile {
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

export const OLD_FILE = new FixtureFile("0.9.25");
export const NEW_FILE = new FixtureFile("0.9.26");
