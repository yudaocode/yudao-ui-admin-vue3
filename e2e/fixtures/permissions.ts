/**
 * Mock 权限/菜单数据
 * 模拟 GET /system/auth/get-permission-info 返回
 *
 * 重要：menus 必须是树形结构（children 嵌套），而非 parentId 平级列表
 * 因为 routerHelper.ts 的 generateRoute() 直接处理 children 数组
 */

/** 管理员权限信息 — 全部权限 */
export const adminPermissionInfo = {
  user: {
    id: 1,
    nickname: 'E2E管理员',
    avatar: '',
    deptId: 100
  },
  roles: ['super_admin'],
  permissions: ['*:*:*'],
  menus: [
    {
      id: 1,
      parentId: 0,
      name: '系统管理',
      path: '/system',
      component: null,
      componentName: null,
      icon: 'ep:tools',
      visible: true,
      keepAlive: true,
      alwaysShow: true,
      type: 0, // 目录
      children: [
        {
          id: 100,
          parentId: 1,
          name: '用户管理',
          path: 'user',
          component: 'system/user/index',
          componentName: 'SystemUser',
          icon: 'ep:user',
          visible: true,
          keepAlive: true,
          type: 1 // 菜单
        },
        {
          id: 101,
          parentId: 1,
          name: '角色管理',
          path: 'role',
          component: 'system/role/index',
          componentName: 'SystemRole',
          icon: 'ep:user-filled',
          visible: true,
          keepAlive: true,
          type: 1
        },
        {
          id: 102,
          parentId: 1,
          name: '菜单管理',
          path: 'menu',
          component: 'system/menu/index',
          componentName: 'SystemMenu',
          icon: 'ep:menu',
          visible: true,
          keepAlive: true,
          type: 1
        }
      ]
    },
    {
      id: 2,
      parentId: 0,
      name: '基础设施',
      path: '/infra',
      component: null,
      componentName: null,
      icon: 'ep:monitor',
      visible: true,
      keepAlive: true,
      alwaysShow: true,
      type: 0,
      children: [
        {
          id: 200,
          parentId: 2,
          name: '配置管理',
          path: 'config',
          component: 'infra/config/index',
          componentName: 'InfraConfig',
          icon: 'ep:setting',
          visible: true,
          keepAlive: true,
          type: 1
        }
      ]
    }
  ]
}

/** 受限用户权限信息 — 仅部分菜单 */
export const limitedPermissionInfo = {
  user: {
    id: 2,
    nickname: 'E2E普通用户',
    avatar: '',
    deptId: 101
  },
  roles: ['common'],
  permissions: ['system:user:list', 'system:user:query'],
  menus: [
    {
      id: 1,
      parentId: 0,
      name: '系统管理',
      path: '/system',
      component: null,
      componentName: null,
      icon: 'ep:tools',
      visible: true,
      keepAlive: true,
      alwaysShow: true,
      type: 0,
      children: [
        {
          id: 100,
          parentId: 1,
          name: '用户管理',
          path: 'user',
          component: 'system/user/index',
          componentName: 'SystemUser',
          icon: 'ep:user',
          visible: true,
          keepAlive: true,
          type: 1
        }
      ]
    }
  ]
}
