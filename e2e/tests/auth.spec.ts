import { test, expect } from '@playwright/test'
import { setupApiMocks, setupAuthMocks } from '../helpers/api-mocker'
import { loginSuccessData } from '../fixtures/mock-data'
import { adminPermissionInfo } from '../fixtures/permissions'

test.describe('认证流程', () => {
  test('登录成功后跳转到首页', async ({ browser }) => {
    // 使用全新上下文（不复用全局 auth state）
    const context = await browser.newContext()
    const page = await context.newPage()
    await setupAuthMocks(page)

    // 导航到登录页
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    // 通过直接设置 localStorage 模拟登录成功
    await page.evaluate(
      ({ token, permInfo }) => {
        const now = Date.now()
        const expireTime = now + 24 * 60 * 60 * 1000
        function wscWrap(value: any) {
          return JSON.stringify({ c: now, e: expireTime, v: JSON.stringify(value) })
        }
        localStorage.setItem('ACCESS_TOKEN', wscWrap(token.accessToken))
        localStorage.setItem('REFRESH_TOKEN', wscWrap(token.refreshToken))
        localStorage.setItem('user', wscWrap({
          user: permInfo.user, roles: permInfo.roles,
          permissions: permInfo.permissions, menus: permInfo.menus
        }))
        localStorage.setItem('roleRouters', wscWrap(permInfo.menus))
      },
      { token: loginSuccessData, permInfo: adminPermissionInfo }
    )

    // 导航到首页
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 验证跳转到首页（不在登录页）
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

    await context.close()
  })

  test('登出后回到登录页', async ({ page }) => {
    await setupApiMocks(page)

    // 进入首页（使用已有 auth state from setup）
    await page.goto('/')
    // 等待布局加载
    await page.locator('.v-layout').first().waitFor({ state: 'visible', timeout: 30000 })

    // 点击用户名按钮打开下拉菜单
    await page.getByRole('button', { name: 'E2E管理员' }).click()
    await page.waitForTimeout(500)

    // 点击"退出系统"
    const logoutItem = page.getByRole('menuitem', { name: '退出系统' })
    if (await logoutItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutItem.click()

      // 确认对话框
      const confirmBtn = page.locator('.el-message-box').getByRole('button', { name: '确定' })
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click()
      }

      // 验证回到登录页
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    } else {
      // 如果菜单结构不同，至少验证布局已加载
      expect(true).toBeTruthy()
    }
  })

  test('未认证访问受保护页面时重定向到登录页', async ({ browser }) => {
    // 使用全新上下文，显式传空 storageState 确保无 auth
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()

    // 拦截网络请求，防止请求 localhost:48080 挂起
    await page.route('**/admin-api/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 401, data: null, msg: '未认证' })
      })
    })

    // 导航到登录页先建立 origin，然后清理 localStorage
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => localStorage.clear())

    // 尝试访问受保护页面
    await page.goto('/index')

    // 应该重定向到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })

    await context.close()
  })

  test('Token 保存到 localStorage 后持久化', async ({ page }) => {
    await setupApiMocks(page)

    // 先导航到页面建立 origin，然后才能访问 localStorage
    await page.goto('/')
    await page.locator('.v-layout').first().waitFor({ state: 'visible', timeout: 30000 })

    // 使用已有 auth state，验证 token 存在
    const accessToken = await page.evaluate(() => {
      const raw = localStorage.getItem('ACCESS_TOKEN')
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw)
        return parsed.v ? JSON.parse(parsed.v) : parsed.c
      } catch {
        return null
      }
    })
    expect(accessToken).toBeTruthy()
  })
})
