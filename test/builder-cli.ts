import { generateElectronProject, clean } from "./builder"
const { program } = require('commander');

program
  .command("clean")
  .argument("<dir>")
  .action((dir: string) => {
    console.log(`clean ${dir}...`)
    clean(dir);
  })

program
  .command("build")
  .arguments("<version> <rootDir>")
  .action((version: string, rootDir: string) => {
    console.log(`build ${version} to ${rootDir}...`)
    generateElectronProject(version, rootDir)
  })

program.parse();
