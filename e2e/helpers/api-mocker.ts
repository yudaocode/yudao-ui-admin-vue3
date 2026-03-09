import type { Page } from '@playwright/test'
import {
  successResponse,
  pageResponse,
  loginSuccessData,
  tenantData,
  dictListSimpleData
} from '../fixtures/mock-data'
import { adminPermissionInfo, limitedPermissionInfo } from '../fixtures/permissions'
import { userList, getNextUserId, type MockUser } from '../fixtures/users'

/**
 * API Mock 拦截器
 * 使用 Playwright page.route() 集中拦截所有 /admin-api/** 请求
 *
 * 重要：Playwright 路由按注册的逆序匹配（后注册 = 高优先级）
 * 因此 fallback 必须先注册，具体路由后注册。
 */

interface MockOptions {
  /** 使用受限权限而非管理员权限 */
  limitedPermissions?: boolean
}

/**
 * 设置所有 API Mock 路由
 * 统一返回 { code: 0, data: ..., msg: '' } 格式
 */
export async function setupApiMocks(page: Page, options: MockOptions = {}) {
  const permissionInfo = options.limitedPermissions
    ? limitedPermissionInfo
    : adminPermissionInfo

  // === Fallback 必须最先注册（优先级最低） ===
  await page.route('**/admin-api/**', async (route) => {
    const method = route.request().method()
    // GET 请求返回空列表或 null，POST/PUT/DELETE 返回 true
    const data = method === 'GET' ? null : true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(data))
    })
  })

  // === 认证相关 ===

  // 登录
  await page.route('**/admin-api/system/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(loginSuccessData))
    })
  })

  // 获取权限信息
  await page.route('**/admin-api/system/auth/get-permission-info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(permissionInfo))
    })
  })

  // 登出
  await page.route('**/admin-api/system/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(true))
    })
  })

  // 租户 - 根据名称获取ID
  await page.route('**/admin-api/system/tenant/get-id-by-name*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(tenantData.id))
    })
  })

  // 租户 - 根据域名获取租户信息
  await page.route('**/admin-api/system/tenant/get-by-website*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(null))
    })
  })

  // === 字典 ===

  // 字典列表
  await page.route('**/admin-api/system/dict-data/simple-list', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(dictListSimpleData))
    })
  })

  // === 用户管理 CRUD ===

  // 用户分页列表
  await page.route('**/admin-api/system/user/page*', async (route) => {
    const url = new URL(route.request().url())
    const pageNo = parseInt(url.searchParams.get('pageNo') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const nickname = url.searchParams.get('nickname') || ''

    let filtered = [...userList]
    if (nickname) {
      filtered = filtered.filter((u) => u.nickname.includes(nickname))
    }

    const start = (pageNo - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse(paged, filtered.length))
    })
  })

  // 用户详情
  await page.route('**/admin-api/system/user/get?*', async (route) => {
    const url = new URL(route.request().url())
    const id = parseInt(url.searchParams.get('id') || '0')
    const user = userList.find((u) => u.id === id)

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(user || null))
    })
  })

  // 新增用户
  await page.route('**/admin-api/system/user/create', async (route) => {
    const newId = getNextUserId()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(newId))
    })
  })

  // 更新用户
  await page.route('**/admin-api/system/user/update', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(true))
    })
  })

  // 删除用户
  await page.route('**/admin-api/system/user/delete*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(true))
    })
  })

  // === 部门 ===
  await page.route('**/admin-api/system/dept/list-all-simple', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        successResponse([
          { id: 100, name: '芋道源码', parentId: 0 },
          { id: 101, name: '研发部门', parentId: 100 },
          { id: 102, name: '测试部门', parentId: 100 },
          { id: 103, name: '运维部门', parentId: 100 }
        ])
      )
    })
  })

  // === 岗位 ===
  await page.route('**/admin-api/system/post/list-all-simple', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        successResponse([
          { id: 1, name: '董事长' },
          { id: 2, name: '项目经理' },
          { id: 4, name: '普通员工' }
        ])
      )
    })
  })

  // === 通知相关 ===
  await page.route('**/admin-api/system/notify-message/get-unread-count', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(0))
    })
  })
}

/**
 * 仅设置认证相关 Mock（用于 auth.setup.ts）
 */
export async function setupAuthMocks(page: Page) {
  // === Fallback 必须最先注册（优先级最低） ===
  await page.route('**/admin-api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(null))
    })
  })

  // 登录
  await page.route('**/admin-api/system/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(loginSuccessData))
    })
  })

  // 权限信息
  await page.route('**/admin-api/system/auth/get-permission-info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(adminPermissionInfo))
    })
  })

  // 租户 - 根据名称获取ID（登录流程中调用）
  await page.route('**/admin-api/system/tenant/get-id-by-name*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(tenantData.id))
    })
  })

  // 租户 - 根据域名获取租户信息（登录页 onMounted 调用）
  await page.route('**/admin-api/system/tenant/get-by-website*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(null))
    })
  })

  // 字典
  await page.route('**/admin-api/system/dict-data/simple-list', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(dictListSimpleData))
    })
  })

  // 通知
  await page.route('**/admin-api/system/notify-message/get-unread-count', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(successResponse(0))
    })
  })
}
