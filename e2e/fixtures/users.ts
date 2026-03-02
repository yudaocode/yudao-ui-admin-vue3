/**
 * Mock 用户 CRUD 数据
 * 模拟 /system/user/* 端点返回
 */

export interface MockUser {
  id: number
  username: string
  nickname: string
  deptId: number
  deptName: string
  mobile: string
  email: string
  sex: number
  status: number
  createTime: number
}

/** 用户列表数据 */
export const userList: MockUser[] = [
  {
    id: 1,
    username: 'admin',
    nickname: '管理员',
    deptId: 100,
    deptName: '芋道源码',
    mobile: '13800138000',
    email: 'admin@yudao.cn',
    sex: 1,
    status: 0,
    createTime: Date.now() - 365 * 24 * 60 * 60 * 1000
  },
  {
    id: 2,
    username: 'yudao',
    nickname: '芋道',
    deptId: 101,
    deptName: '研发部门',
    mobile: '13800138001',
    email: 'yudao@yudao.cn',
    sex: 1,
    status: 0,
    createTime: Date.now() - 180 * 24 * 60 * 60 * 1000
  },
  {
    id: 3,
    username: 'test',
    nickname: '测试用户',
    deptId: 102,
    deptName: '测试部门',
    mobile: '13800138002',
    email: 'test@yudao.cn',
    sex: 2,
    status: 0,
    createTime: Date.now() - 90 * 24 * 60 * 60 * 1000
  },
  {
    id: 4,
    username: 'disabled',
    nickname: '禁用用户',
    deptId: 103,
    deptName: '运维部门',
    mobile: '13800138003',
    email: 'disabled@yudao.cn',
    sex: 1,
    status: 1,
    createTime: Date.now() - 60 * 24 * 60 * 60 * 1000
  }
]

/** 生成新用户 ID */
let nextId = 100
export function getNextUserId() {
  return nextId++
}
