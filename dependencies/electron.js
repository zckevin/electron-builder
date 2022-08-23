const current_version = "20.0.2"

function appendElectron(obj) {
  return {
    "electron": current_version,
    ...obj
  }
}

module.exports = {
  appendElectron,
}