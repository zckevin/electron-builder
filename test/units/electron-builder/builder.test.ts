import * as builder from 'electron-builder'
import basicConfig from "./buildConfig"

const Platform = builder.Platform

test("zcsb", async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget(),
    config: basicConfig
  } as any).then((result: any) => {
    console.log(JSON.stringify(result))
  }).catch((error: any) => {
    console.error(error)
  })

  expect(1 + 1).toEqual(2);
}, 1000 * 10)
