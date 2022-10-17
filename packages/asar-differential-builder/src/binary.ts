import * as fs from "fs"
import { notNull } from "./helper";

const oses = [
  "linux",
  "darwin",
  "windows",
];

const arches = [
  "arm",
  "arm64",
  "386",
  "amd64",
]

export interface BinaryTarget {
  /**
   * binary file full name
   */
  name: string
  os: string
  arch: string
}

export function parseBinaryFileName(name: string): BinaryTarget | null {
  // https://regex101.com/r/0ZBeT5/1
  const result = /.+-([^-]+)-([^-.]+)(?:\.exe)?$/.exec(name);
  if (result?.length === 3) {
    const [_, os, arch] = result;
    if (oses.includes(os) && arches.includes(arch)) {
      return { name, os, arch }
    }
  }
  // throw new Error(`Invalid binary naming without os-arch suffix: ${name}`)
  return null
}


export function findBinaryTargetsInDir(dir: string): Array<BinaryTarget> {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => !item.isDirectory())
    .map(item => item.name)
    .map(parseBinaryFileName)
    .filter(notNull)
}