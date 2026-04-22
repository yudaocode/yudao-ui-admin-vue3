import request from '@/config/axios'

/**
 * IM 用户查询 API
 *
 * 已迁移到 system 模块：
 * - 点头像弹名片：`GET /system/user/get-simple`
 * - 按昵称搜索（加好友）：`GET /system/user/list-by-nickname`
 * 登录用户信息统一使用 `/system/user/profile/get`
 */

/** IM 用户精简信息（对齐后端 UserSimpleRespVO） */
export interface ImUserSimpleRespVO {
  id: number
  nickname: string
  avatar?: string
  /** 0=未知 1=男 2=女 */
  sex?: number
  deptId?: number
  deptName?: string
  /** 是否在线（后端暂不支持，前端占位；后续由 WebSocket session 计算） */
  online?: boolean
}

/** 按用户编号查询用户精简信息（点头像弹名片） */
export const getSimpleUser = (id: number | string) => {
  return request.get<ImUserSimpleRespVO>({
    url: '/system/user/get-simple',
    params: { id }
  })
}

/** 按昵称模糊搜索用户（加好友） */
export const getSimpleUserListByNickname = (nickname: string) => {
  return request.get<ImUserSimpleRespVO[]>({
    url: '/system/user/list-by-nickname',
    params: { nickname }
  })
}
