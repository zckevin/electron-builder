// Github actions' OS X runner has very limitted IO performance,
// it took a undetermined long period of time to generate new projects
// in playwright tests and would fail if we don't set a large enough timeout.
//
// Run generator in test.yml instead of playwright tests
//
// Artifacts would be saved into /test/ci_pregenerated_projects, and it would be copied into //test/dist
// in tests, /test/ci_pregenerated_projects could be reused between tests

import * as fsExtra from "fs-extra"
const path = require("path")

import { generateProjectForE2e } from "./helper"
import { DIST_DIR } from "../global"

const PREGENERATED_DIR_PATH = path.join(DIST_DIR, `ci_pregenerated_projects`)
const versions = ["0.0.1", "0.0.2"]

async function generateTestingProjectsForCi(versions: string[], destDir: string) {
  fsExtra.ensureDirSync(PREGENERATED_DIR_PATH)
  fsExtra.emptyDirSync(PREGENERATED_DIR_PATH)
  await generateProjectForE2e(versions, destDir)

  // fsExtra.ensureDirSync(destDir)
  // fsExtra.copySync(DIST_DIR, destDir)
  console.log("=================================================================")
  console.log(`generate testing projects ${versions} to ${destDir}`)
  console.log("=================================================================")
}

generateTestingProjectsForCi(versions, PREGENERATED_DIR_PATH)