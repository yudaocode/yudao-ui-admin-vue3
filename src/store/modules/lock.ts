import { defineStore } from 'pinia'
import { store } from '@/store'

interface lockInfo {
  isLock?: boolean
  password?: string
}

interface LockState {
  lockInfo: lockInfo
}

// TODO 芋艿：【锁屏】这里有报错，后续解决下
export const useLockStore = defineStore('lock', {
  state: (): LockState => {
    return {
      lockInfo: {
        // isLock: false, // 是否锁定屏幕
        // password: '' // 锁屏密码
      }
    }
  },
  getters: {
    getLockInfo(): lockInfo {
      return this.lockInfo
    }
  },
  actions: {
    setLockInfo(lockInfo: lockInfo) {
      this.lockInfo = lockInfo
    },
    resetLockInfo() {
      this.lockInfo = {}
    },
    unLock(password: string) {
      if (this.lockInfo?.password === password) {
        this.resetLockInfo()
        return true
      } else {
        return false
      }
    }
  },
  persist: {
    enabled: true,
    strategies: [{ key: 'lock', storage: localStorage }]
  }
})

export const useLockStoreWithOut = () => {
  return useLockStore(store)
}
