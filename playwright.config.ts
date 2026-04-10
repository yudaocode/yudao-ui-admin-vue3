import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 * 使用 .env.e2e 关闭验证码/租户/加密以简化 Mock
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:80',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    // Setup project: performs login and saves auth state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/
    },
    // Main test project: depends on setup for auth state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json'
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/
    }
  ],
  webServer: {
    command: 'vite --mode e2e',
    url: 'http://localhost:80',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
