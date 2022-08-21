# ...

## use @zckevin/electron-builder

```bash
# install
npm install --save-dev @zckevin/electron-builder

# install other dependencies from original electron-builder
npm install --save-dev builder-util-runtime dmg-builder builder-util
```

## use electron-updater

Install

```bash
# install
npm install --save @zckevin/electron-asar-differential-updater 


# install other dependencies from original electron-builder
npm install --save-dev builder-util-runtime
```

Set `differentialAsarZip` in package.json

```
{
  "build": {
    // ...

    differentialAsarZip: true
  }
}
```

## dev

Use the following Node/pnpm versions in case `pnpm install` fails:

```
node version: 16.16.0
pnpm version: 7.6.0
```
