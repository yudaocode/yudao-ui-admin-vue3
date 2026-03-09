import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model: 用户管理 CRUD 页面
 */
export class UserManagementPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly resetButton: Locator
  readonly addButton: Locator
  readonly table: Locator
  readonly pagination: Locator

  constructor(page: Page) {
    this.page = page
    // 搜索区域
    this.searchInput = page.locator('.el-form').first().locator('input').first()
    this.searchButton = page.getByRole('button', { name: /搜索/ })
    this.resetButton = page.getByRole('button', { name: /重置/ })
    // 新增按钮
    this.addButton = page.getByRole('button', { name: /新增/ })
    // 表格
    this.table = page.locator('.el-table').first()
    // 分页
    this.pagination = page.locator('.el-pagination').first()
  }

  /** 获取表格行数 */
  async getTableRowCount(): Promise<number> {
    const rows = this.table.locator('.el-table__body-wrapper .el-table__row')
    return rows.count()
  }

  /** 获取表格指定列的文本 */
  async getColumnTexts(columnIndex: number): Promise<string[]> {
    const cells = this.table.locator(
      `.el-table__body-wrapper .el-table__row td:nth-child(${columnIndex + 1})`
    )
    const texts: string[] = []
    const count = await cells.count()
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent()
      if (text !== null) {
        texts.push(text.trim())
      }
    }
    return texts
  }

  /** 搜索用户 */
  async searchUser(keyword: string) {
    await this.searchInput.fill(keyword)
    await this.searchButton.click()
  }

  /** 重置搜索 */
  async resetSearch() {
    await this.resetButton.click()
  }

  /** 点击新增按钮 */
  async clickAdd() {
    await this.addButton.click()
  }

  /** 在弹窗表单中填写用户信息 */
  async fillUserForm(data: { username?: string; nickname?: string; mobile?: string }) {
    const dialog = this.page.locator('.el-dialog').last()
    if (data.username) {
      await dialog.locator('label:has-text("用户账号")').locator('..').locator('input').fill(data.username)
    }
    if (data.nickname) {
      await dialog.locator('label:has-text("用户昵称")').locator('..').locator('input').fill(data.nickname)
    }
    if (data.mobile) {
      await dialog.locator('label:has-text("手机号码")').locator('..').locator('input').fill(data.mobile)
    }
  }

  /** 提交弹窗表单 */
  async submitForm() {
    const dialog = this.page.locator('.el-dialog').last()
    await dialog.getByRole('button', { name: /确定|保存/ }).click()
  }

  /** 点击指定行的编辑按钮 */
  async clickEditOnRow(rowIndex: number) {
    const row = this.table.locator('.el-table__body-wrapper .el-table__row').nth(rowIndex)
    await row.getByRole('button', { name: /修改/ }).click()
  }

  /** 点击指定行的删除按钮（隐藏在"更多"下拉菜单中） */
  async clickDeleteOnRow(rowIndex: number) {
    const row = this.table.locator('.el-table__body-wrapper .el-table__row').nth(rowIndex)
    // "删除"按钮在"更多"下拉菜单中
    await row.getByRole('button', { name: '更多' }).click()
    await this.page.waitForTimeout(300)
    // 点击弹出菜单中的"删除"
    await this.page.getByRole('menuitem', { name: /删除/ }).click()
  }

  /** 确认删除弹窗 */
  async confirmDelete() {
    await this.page.getByRole('button', { name: /确定|是/ }).click()
  }

  /** 获取当前分页信息 */
  async getPaginationInfo(): Promise<string> {
    return (await this.pagination.textContent()) || ''
  }

  /** 点击下一页 */
  async goToNextPage() {
    await this.pagination.locator('.btn-next').click()
  }
}
