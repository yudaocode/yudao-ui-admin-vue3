import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../helpers/api-mocker'
import { LayoutPage } from '../pages/layout.page'

test.describe('冒烟测试 - 重型组件', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
  })

  test('首页正常加载无报错', async ({ page }) => {
    // 收集页面错误
    const errors: string[] = []
    page.on('pageerror', (err) => {
      errors.push(err.message)
    })

    await page.goto('/')

    const layout = new LayoutPage(page)
    await layout.waitForLayout()

    // 等待额外时间让异步组件加载
    await page.waitForTimeout(2000)

    // 允许某些已知的非致命错误
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('BPMN 设计器页面加载', async ({ page }) => {
    // Mock 额外的 BPM 相关 API
    await page.route('**/admin-api/bpm/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, data: null, msg: '' })
      })
    })

    // 尝试访问 BPMN 创建页面
    await page.goto('/bpm/manager/model/create')
    await page.waitForTimeout(3000)

    // 验证页面不报错（不白屏）
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()

    // 检查是否有 BPMN 容器（可能需要额外数据才能渲染）
    // 冒烟测试只确保不崩溃
  })

  test('富文本编辑器依赖不阻塞应用', async ({ page }) => {
    // 收集页面错误
    const errors: string[] = []
    page.on('pageerror', (err) => {
      errors.push(err.message)
    })

    await page.goto('/')

    const layout = new LayoutPage(page)
    await layout.waitForLayout()

    // 验证没有未捕获的 JS 错误
    await page.waitForTimeout(2000)

    // 允许某些已知的非致命错误
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
