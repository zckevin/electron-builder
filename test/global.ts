const path = require("path");
const appRoot = require("app-root-path");

// appRoot is @zckevin/electron-builder
export const TEST_ROOT_DIR = path.join(appRoot.toString(), "test");
export const DIST_DIR = path.join(TEST_ROOT_DIR, "dist");