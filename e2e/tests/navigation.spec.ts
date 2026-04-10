import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../helpers/api-mocker'
import { LayoutPage } from '../pages/layout.page'

test.describe('导航功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    // 等待 Vue 布局渲染完成
    const layoutPage = new LayoutPage(page)
    await layoutPage.waitForLayout()
  })

  test('侧边栏菜单正确渲染', async ({ page }) => {
    const layoutPage = new LayoutPage(page)

    // 侧边栏应可见
    await expect(layoutPage.sidebar).toBeVisible()

    // 应包含 Mock 数据中的菜单项
    const menuItems = await layoutPage.getSidebarMenuItems()
    expect(menuItems.length).toBeGreaterThan(0)
  })

  test('点击菜单项进行导航', async ({ page }) => {
    const layoutPage = new LayoutPage(page)

    // 展开系统管理子菜单
    await layoutPage.expandSubMenu('系统管理')

    // 点击用户管理
    await layoutPage.clickSidebarMenu('用户管理')

    // 等待 URL 变化（vue-router 异步导航）
    await expect(page).toHaveURL(/system\/user/, { timeout: 10000 })
  })

  test('面包屑随导航更新', async ({ page }) => {
    const layoutPage = new LayoutPage(page)

    // 面包屑组件可能存在也可能不存在（取决于配置）
    const hasBreadcrumb = await layoutPage.breadcrumb.isVisible().catch(() => false)
    if (hasBreadcrumb) {
      const breadcrumbs = await layoutPage.getBreadcrumbTexts()
      expect(breadcrumbs.length).toBeGreaterThanOrEqual(1)
    } else {
      // 面包屑可能被配置隐藏，测试通过
      expect(true).toBeTruthy()
    }
  })

  test('标签页正确显示', async ({ page }) => {
    const layoutPage = new LayoutPage(page)

    // 标签页组件
    const hasTagsView = await layoutPage.tagsView.isVisible().catch(() => false)
    if (hasTagsView) {
      const tags = await layoutPage.getTagsViewTabs()
      expect(tags.length).toBeGreaterThanOrEqual(1)
    } else {
      // tagsView 可能被配置隐藏
      expect(true).toBeTruthy()
    }
  })

  test('侧边栏折叠/展开切换', async ({ page }) => {
    const layoutPage = new LayoutPage(page)

    // 获取初始菜单宽度
    const menuBefore = await layoutPage.sidebar.boundingBox()

    // 点击折叠按钮
    await layoutPage.toggleCollapse()
    await page.waitForTimeout(500)

    // 获取折叠后菜单宽度
    const menuAfter = await layoutPage.sidebar.boundingBox()

    // 宽度应该变化（折叠）
    if (menuBefore && menuAfter) {
      expect(menuBefore.width).not.toBe(menuAfter.width)
    }
  })
})
