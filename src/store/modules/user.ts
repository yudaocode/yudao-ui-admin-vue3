import { store } from '@/store'
import { defineStore } from 'pinia'
import { getAccessToken, removeToken } from '@/utils/auth'
import { CACHE_KEY, useCache, deleteUserCache } from '@/hooks/web/useCache'
import { getInfo, loginOut } from '@/api/login'
import { resetRouter } from '@/router'
import { usePermissionStoreWithOut } from './permission'
// 与 tagsView 互相引用：双方只在 action 运行时取对方 store，模块加载阶段不访问，循环引用安全
import { useTagsViewStoreWithOut } from './tagsView'

const { wsCache } = useCache()

// 会话代号：每次清理会话（登出）时递增。异步加载开始时记下代号，返回时代号已变，说明期间已登出
// （可能已有其他用户重新登录），结果作废，不再写入用户信息、注册路由或清理登录状态
let sessionEpoch = 0

export const getSessionEpoch = (): number => sessionEpoch

export const isCurrentSession = (epoch: number): boolean => epoch === sessionEpoch

interface UserVO {
  id: number
  avatar: string
  nickname: string
  deptId: number
}

interface UserInfoVO {
  // USER 缓存
  permissions: Set<string>
  roles: string[]
  isSetUser: boolean
  user: UserVO
}

export const useUserStore = defineStore('admin-user', {
  state: (): UserInfoVO => ({
    permissions: new Set<string>(),
    roles: [],
    isSetUser: false,
    user: {
      id: 0,
      avatar: '',
      nickname: '',
      deptId: 0
    }
  }),
  getters: {
    getPermissions(): Set<string> {
      return this.permissions
    },
    getRoles(): string[] {
      return this.roles
    },
    getIsSetUser(): boolean {
      return this.isSetUser
    },
    getUser(): UserVO {
      return this.user
    }
  },
  actions: {
    async setUserInfoAction() {
      if (!getAccessToken()) {
        this.resetState()
        return null
      }
      const epoch = getSessionEpoch()
      let userInfo = wsCache.get(CACHE_KEY.USER)
      if (!userInfo) {
        userInfo = await getInfo()
      } else {
        // 特殊：在有缓存的情况下，进行加载。但是即使加载失败，也不影响后续的操作，保证可以进入系统
        try {
          userInfo = await getInfo()
        } catch (error) {}
      }
      // 加载期间已登出（可能已有其他用户登录）：丢弃旧结果，不写入状态与缓存
      if (!isCurrentSession(epoch)) {
        throw new Error('登录会话已结束，丢弃过期的用户信息')
      }
      this.permissions = new Set(userInfo.permissions || []) // 兜底为 [] https://t.zsxq.com/xCJew
      this.roles = userInfo.roles
      this.user = userInfo.user
      this.isSetUser = true
      wsCache.set(CACHE_KEY.USER, userInfo)
      wsCache.set(CACHE_KEY.ROLE_ROUTERS, userInfo.menus)
    },
    async setUserAvatarAction(avatar: string) {
      const userInfo = wsCache.get(CACHE_KEY.USER)
      // NOTE: 是否需要像`setUserInfoAction`一样判断`userInfo != null`
      this.user.avatar = avatar
      userInfo.user.avatar = avatar
      wsCache.set(CACHE_KEY.USER, userInfo)
    },
    async setUserNicknameAction(nickname: string) {
      const userInfo = wsCache.get(CACHE_KEY.USER)
      // NOTE: 是否需要像`setUserInfoAction`一样判断`userInfo != null`
      this.user.nickname = nickname
      userInfo.user.nickname = nickname
      wsCache.set(CACHE_KEY.USER, userInfo)
    },
    // 登出接口失败（如网络异常、服务不可用）时也清理本地登录态，错误仍抛给调用方
    async loginOut() {
      try {
        await loginOut()
      } finally {
        this.clearSession()
      }
    },
    // 清理本地会话：token、用户缓存与状态、标签页与页面缓存、菜单状态，并重置为初始静态路由表；
    // 递增会话代号，使进行中的加载（用户信息、菜单路由）结果作废
    clearSession() {
      sessionEpoch++
      removeToken()
      deleteUserCache() // 删除用户缓存
      this.resetState()
      // 须在 resetState 之后：此时已非登录态，固定标签一并清空
      useTagsViewStoreWithOut().delAllViews()
      usePermissionStoreWithOut().$reset()
      resetRouter()
    },
    resetState() {
      this.permissions = new Set<string>()
      this.roles = []
      this.isSetUser = false
      this.user = {
        id: 0,
        avatar: '',
        nickname: '',
        deptId: 0
      }
    }
  }
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
