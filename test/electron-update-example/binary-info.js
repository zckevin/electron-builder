const os = require('os');

function getGoBinaryInfo() {
  let arch = os.arch();
  let operatingSystem = os.platform();
  // name mapping from Node -> Go
  switch (arch) {
    case "x64":
      arch = "amd64";
      break;
    case "ia32":
      arch = "386";
      break;
  }
  switch (operatingSystem) {
    case "win32":
      operatingSystem = "windows";
      break;
  }
  // ...
  const suffix = (operatingSystem === "windows") ? ".exe" : "";
  return {
    name: `http-server-${operatingSystem}-${arch}${suffix}`,
    operatingSystem,
    arch,
  }
}

module.exports = {
  getGoBinaryInfo,
}