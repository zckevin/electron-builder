import * as fsExtra from "fs-extra"

export function checkPathExists(path: string) {
  if (!fsExtra.pathExistsSync(path)) {
    throw new Error(`Required path does not exists: ${path}`)
  }
}

export function notNull<T>(argument: T | null): argument is T {
    return argument !== null
}