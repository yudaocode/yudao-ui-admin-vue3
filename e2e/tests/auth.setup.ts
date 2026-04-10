import { test as setup, expect } from '@playwright/test'
import { setupAuthMocks } from '../helpers/api-mocker'
import { loginSuccessData } from '../fixtures/mock-data'
import { adminPermissionInfo } from '../fixtures/permissions'

const authFile = 'e2e/.auth/user.json'

/**
 * 认证 Setup Project
 * 1. 导航到登录页（建立 origin）
 * 2. 使用 evaluate 直接设置 localStorage（web-storage-cache 格式）
 * 3. 重新加载页面，验证认证生效
 */
setup('authenticate', async ({ page }) => {
  // 设置 API Mock
  await setupAuthMocks(page)

  // 步骤1：导航到登录页，建立 origin
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  // 步骤2：直接设置 localStorage
  // web-storage-cache 格式：{ c: createTime, e: expiresTime, v: JSON.stringify(value) }
  await page.evaluate(
    ({ token, permInfo }) => {
      const now = Date.now()
      const expireTime = now + 24 * 60 * 60 * 1000

      function wscWrap(value: any) {
        return JSON.stringify({
          c: now,
          e: expireTime,
          v: JSON.stringify(value)
        })
      }

      localStorage.setItem('ACCESS_TOKEN', wscWrap(token.accessToken))
      localStorage.setItem('REFRESH_TOKEN', wscWrap(token.refreshToken))
      localStorage.setItem(
        'user',
        wscWrap({
          user: permInfo.user,
          roles: permInfo.roles,
          permissions: permInfo.permissions,
          menus: permInfo.menus
        })
      )
      localStorage.setItem('roleRouters', wscWrap(permInfo.menus))
    },
    { token: loginSuccessData, permInfo: adminPermissionInfo }
  )

  // 步骤3：重新加载，让 Vue app 读取 localStorage 中的 token
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 验证不在登录页
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

  // 保存认证状态
  await page.context().storageState({ path: authFile })
})
