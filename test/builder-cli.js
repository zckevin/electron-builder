const { program } = require('commander');
const { generateElectronProject, clean } = require("./builder.js")

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
    generateElectronProject(version, rootDir)
  })

program.parse();
