const { program } = require('commander');
const { buildElectronProject, clean } = require("./builder.js")

program
  .command("clean")
  .argument("<dir>")
  .action(dir => {
    console.log(`clean ${dir}...`)
    clean(dir);
  })

program
  .command("build")
  .arguments("<version> <rootDir>")
  .action((version, rootDir) => {
    console.log(`build ${version} to ${rootDir}...`)
    buildElectronProject(version, rootDir)
  })

program.parse();
