import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './playwright',
  maxFailures: 1,
}

export default config