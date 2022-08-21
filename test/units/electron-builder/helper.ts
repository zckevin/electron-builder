import * as builder from 'electron-builder'
import { Platform } from 'app-builder-lib'

export let platform: Platform;

switch (process.platform) {
  case "darwin":
    platform = builder.Platform.MAC;
    break;
  case "linux":
    platform = builder.Platform.LINUX;
    break;
  case "win32":
    platform = builder.Platform.WINDOWS;
    break;
  default:
    throw new Error(`Unknown platform: ${process.platform}`);
}

