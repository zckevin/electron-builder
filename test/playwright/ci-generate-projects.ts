import * as fsExtra from "fs-extra"
const path = require("path")

import { generateTestingProjects } from "./helper"
import { DIST_DIR } from "../global"

const destDir = path.join(DIST_DIR, `../dist2`)

async function generateTestingProjectsForCi(versions: string[], destDir: string) {
  fsExtra.ensureDirSync(DIST_DIR)
  fsExtra.emptyDirSync(DIST_DIR)

  await generateTestingProjects(versions)

  fsExtra.ensureDirSync(destDir)
  fsExtra.copySync(DIST_DIR, destDir)
  console.log("=================================================================")
  console.log(`generate testing projects ${versions} to ${destDir}`)
  console.log("=================================================================")
}

async function run() {
  await generateTestingProjectsForCi(["0.0.1", "0.0.2"], destDir)
}

run()