import { test as setup, expect } from '@playwright/test'
import { setupAuthMocks } from '../helpers/api-mocker'
import { loginSuccessData } from '../fixtures/mock-data'
import { adminPermissionInfo } from '../fixtures/permissions'

const authFile = 'e2e/.auth/user.json'

/**
 * 认证 Setup Project
 * 1. 在页面脚本执行前注入 localStorage（web-storage-cache 格式）
 * 2. 导航到首页，让 Vue app 在启动时直接读取认证信息
 * 3. 验证认证生效并保存 storageState
 */
setup('authenticate', async ({ page }) => {
  // 设置 API Mock
  await setupAuthMocks(page)

  // 步骤1：在应用脚本运行前注入 localStorage，避免页面跳转时 evaluate 失效
  // web-storage-cache 格式：{ c: createTime, e: expiresTime, v: JSON.stringify(value) }
  await page.addInitScript(
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

  // 步骤2：首次导航时，Vue app 会直接读取 localStorage 中的 token
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 步骤3：验证不在登录页
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

  // 保存认证状态
  await page.context().storageState({ path: authFile })
})
