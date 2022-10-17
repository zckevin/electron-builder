import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './playwright',
  maxFailures: 1,
  timeout: 10 * 60 * 1000,
  globalTimeout: 30 * 60 * 1000,
}

export default config