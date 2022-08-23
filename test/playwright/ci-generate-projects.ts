// Github actions' OS X runner has very limitted IO performance,
// it took a undetermined long period of time to generate new projects
// in playwright tests and would fail if we don't set a large enough timeout.
//
// Run generator in test.yml instead of playwright tests
//
// Artifacts would be saved into /test/dist2, and it would be copied into //test/dist
// in tests, /test/dist2 could be reused between tests

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