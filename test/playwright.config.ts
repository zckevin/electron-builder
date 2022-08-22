import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './playwright',
  maxFailures: 3,
}

export default config