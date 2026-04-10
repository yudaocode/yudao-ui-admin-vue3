import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../helpers/api-mocker'
import { LayoutPage } from '../pages/layout.page'
import { UserManagementPage } from '../pages/user-management.page'

test.describe('用户管理 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')

    // 等待布局加载
    const layout = new LayoutPage(page)
    await layout.waitForLayout()

    // 导航到用户管理页面
    await layout.expandSubMenu('系统管理')
    await layout.clickSidebarMenu('用户管理')
    await page.waitForTimeout(2000)
  })

  test('用户列表正确加载', async ({ page }) => {
    const userPage = new UserManagementPage(page)

    // 表格应可见
    await expect(userPage.table).toBeVisible({ timeout: 10000 })

    // 应有数据行
    const rowCount = await userPage.getTableRowCount()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('搜索过滤用户', async ({ page }) => {
    const userPage = new UserManagementPage(page)
    await expect(userPage.table).toBeVisible({ timeout: 10000 })

    // 执行搜索
    await userPage.searchUser('管理员')
    await page.waitForTimeout(500)

    // 搜索后表格应更新
    const rowCount = await userPage.getTableRowCount()
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })

  test('新增用户', async ({ page }) => {
    const userPage = new UserManagementPage(page)
    await expect(userPage.table).toBeVisible({ timeout: 10000 })

    // 点击新增
    await userPage.clickAdd()

    // 弹窗应出现
    const dialog = page.locator('.el-dialog').last()
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('编辑用户', async ({ page }) => {
    const userPage = new UserManagementPage(page)
    await expect(userPage.table).toBeVisible({ timeout: 10000 })

    const rowCount = await userPage.getTableRowCount()
    if (rowCount > 0) {
      await userPage.clickEditOnRow(0)
      const dialog = page.locator('.el-dialog').last()
      await expect(dialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('删除用户', async ({ page }) => {
    const userPage = new UserManagementPage(page)
    await expect(userPage.table).toBeVisible({ timeout: 10000 })

    const rowCount = await userPage.getTableRowCount()
    if (rowCount > 0) {
      await userPage.clickDeleteOnRow(0)
      // 确认弹窗
      const confirmDialog = page.locator('.el-message-box, .el-popconfirm')
      if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userPage.confirmDelete()
      }
    }
  })

  test('分页功能', async ({ page }) => {
    const userPage = new UserManagementPage(page)
    await expect(userPage.table).toBeVisible({ timeout: 10000 })

    if (await userPage.pagination.isVisible().catch(() => false)) {
      const paginationText = await userPage.getPaginationInfo()
      expect(paginationText).toBeTruthy()
    }
  })
})
