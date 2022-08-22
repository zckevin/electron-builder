import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './playwright',
  maxFailures: 1,
  timeout: 3 * 60 * 1000,
  globalTimeout: 10 * 60 * 1000,
}

export default config