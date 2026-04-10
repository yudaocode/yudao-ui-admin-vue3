import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model: 登录页
 * 注意：placeholder 使用 i18n 翻译，中文为 "请输入用户名" / "请输入密码"
 * 表单默认预填充了 admin / admin123
 */
export class LoginPage {
  readonly page: Page
  readonly tenantInput: Locator
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.tenantInput = page.getByPlaceholder('请输入租户名称')
    this.usernameInput = page.getByPlaceholder('请输入用户名')
    this.passwordInput = page.getByPlaceholder('请输入密码')
    // XButton 渲染为 el-button，按钮文字来自 i18n t('login.login') = '登录'
    // exact: true 避免匹配 "手机登录"、"二维码登录" 等
    this.loginButton = page.getByRole('button', { name: '登录', exact: true })
  }

  /** 导航到登录页 */
  async goto() {
    await this.page.goto('/login')
    // 等待登录表单渲染完毕
    await this.loginButton.waitFor({ state: 'visible', timeout: 15000 })
  }

  /** 使用指定凭据登录 */
  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  /** 使用默认凭据登录（表单已预填充，直接点击登录） */
  async loginWithDefaults() {
    await this.loginButton.click()
  }

  /** 检查是否在登录页 */
  async isOnLoginPage(): Promise<boolean> {
    return this.loginButton.isVisible()
  }
}
