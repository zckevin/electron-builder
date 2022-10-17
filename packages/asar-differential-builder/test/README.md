## local dev

```bash
# create symlink from //electron-builder/packages/electron-updater
# //node_modules/@zckevin/electron-asar-differential-updater

```

## generate & serve electron-update-example demo

```bash
# generate 3 versions: 0.0.1, 0.0.2, 0.0.3
# projects would be generated to target dir /tmp/electron-builder-dist
# http-server for updation would serve on http://0.0.0.0:10087
npx ts-node ./demo-cli.ts serve 3 /tmp/electron-builder-dist
```

## run unit tests

```bash
# unit tests
npm run test:unit

# e2e tests
npm run test:e2e

# run all
npm run test
```