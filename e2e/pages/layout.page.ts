import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model: 布局（侧边栏、面包屑、标签页）
 * CSS 类名前缀: v- (来自 useDesign hook)
 */
export class LayoutPage {
  readonly page: Page
  readonly sidebar: Locator
  readonly breadcrumb: Locator
  readonly tagsView: Locator
  readonly userAvatar: Locator
  readonly collapseButton: Locator
  readonly layoutRoot: Locator

  constructor(page: Page) {
    this.page = page
    // 使用项目实际的 CSS 类名
    this.layoutRoot = page.locator('.v-layout').first()
    this.sidebar = page.locator('#v-menu, .v-menu').first()
    this.breadcrumb = page.locator('.el-breadcrumb').first()
    this.tagsView = page.locator('#v-tags-view, .v-tags-view').first()
    this.userAvatar = page.locator('.v-tool-header').first().locator('.cursor-pointer').last()
    this.collapseButton = page.locator('.v-tool-header').first().locator('.cursor-pointer').first()
  }

  /** 等待布局完全加载（loading spinner 消失，layout 出现） */
  async waitForLayout() {
    // 等待 Vue app 替换 loading spinner
    await this.layoutRoot.waitFor({ state: 'visible', timeout: 30000 })
  }

  /** 获取侧边栏所有菜单项 */
  async getSidebarMenuItems(): Promise<string[]> {
    const items = this.sidebar.locator('.el-menu-item, .el-sub-menu__title')
    const texts: string[] = []
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent()
      if (text?.trim()) {
        texts.push(text.trim())
      }
    }
    return texts
  }

  /** 点击侧边栏中指定菜单项（叶子节点） */
  async clickSidebarMenu(menuText: string) {
    await this.sidebar
      .locator('.el-menu-item', { hasText: menuText })
      .first()
      .click()
  }

  /** 展开侧边栏子菜单（父级目录） */
  async expandSubMenu(menuText: string) {
    const subMenu = this.sidebar
      .locator('.el-sub-menu__title', { hasText: menuText })
      .first()
    // 如果子菜单还没展开，才点击
    await subMenu.click()
    // 等待子菜单动画完成
    await this.page.waitForTimeout(500)
  }

  /** 获取面包屑文本列表 */
  async getBreadcrumbTexts(): Promise<string[]> {
    const items = this.breadcrumb.locator('.el-breadcrumb__item')
    const texts: string[] = []
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent()
      if (text?.trim()) {
        texts.push(text.trim())
      }
    }
    return texts
  }

  /** 获取标签页标签列表 */
  async getTagsViewTabs(): Promise<string[]> {
    const tags = this.tagsView.locator('.v-tags-view__item')
    const texts: string[] = []
    const count = await tags.count()
    for (let i = 0; i < count; i++) {
      const text = await tags.nth(i).textContent()
      if (text?.trim()) {
        texts.push(text.trim())
      }
    }
    return texts
  }

  /** 点击折叠/展开按钮 */
  async toggleCollapse() {
    await this.collapseButton.click()
  }

  /** 登出操作 */
  async logout() {
    await this.userAvatar.click()
    await this.page.getByText('退出登录').click()
    // 确认对话框
    const confirmButton = this.page.locator('.el-message-box').getByRole('button', { name: '确定' })
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click()
    }
  }
}
