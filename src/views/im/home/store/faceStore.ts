import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { store } from '@/store'

import { getFacePackList as apiGetFacePackList, type ImFacePackUserVO } from '@/api/im/face/pack'
import {
  getFaceUserItemList as apiGetFaceUserItemList,
  createFaceUserItem as apiCreateFaceUserItem,
  deleteFaceUserItem as apiDeleteFaceUserItem,
  type ImFaceUserItemVO,
  type ImFaceUserItemSaveReqVO
} from '@/api/im/face/useritem'

/**
 * IM 表情面板数据 store（系统表情包 + 个人表情）
 *
 * 不持久化：数据小、低频；每次进 IM 第一次打开表情面板时按需拉，关 tab 即丢弃
 * - 系统包：IM 主页 onMounted 后台预拉（不阻塞首屏），消除面板首次展开的白屏
 * - 个人表情：切到「收藏」tab / 长按消息「添加到表情」时按需拉
 */
export const useFaceStore = defineStore('imFace', () => {
  /** 系统表情包列表（含每个包的 items）；运营管理后台维护 */
  const facePacks = ref<ImFacePackUserVO[]>([])
  /** 个人表情包列表（用户长按「添加到表情」/ 上传产生） */
  const faceUserItems = ref<ImFaceUserItemVO[]>([])

  /** clear() 时递增；旧账号请求返回后不写入新账号内存 */
  let storeEpoch = 0

  /**
   * 系统表情包拉取 promise；ensureFacePackList 内 cache：
   * - null = 还没拉过，下次调用真发请求
   * - resolve 后保留对象 = 后续调用 await 立即返回，不再发请求
   * - reject 后置回 null，让调用方下次重试
   */
  let facePacksPromise: Promise<void> | null = null
  /** 按需拉取系统表情包（已拉过则直接复用 cached promise） */
  async function ensureFacePackList(): Promise<void> {
    if (!facePacksPromise) {
      const requestEpoch = storeEpoch
      facePacksPromise = apiGetFacePackList()
        .then((data) => {
          if (requestEpoch !== storeEpoch) {
            return
          }
          facePacks.value = data || []
        })
        .catch((e) => {
          console.warn('[IM] 拉取表情包失败', e)
          if (requestEpoch === storeEpoch) {
            facePacksPromise = null
          }
          throw e
        })
    }
    return facePacksPromise
  }

  /** 个人表情拉取 promise；语义同上 */
  let faceUserItemsPromise: Promise<void> | null = null
  /** 按需拉取个人表情（已拉过则直接复用 cached promise） */
  async function ensureFaceUserItemList(): Promise<void> {
    if (!faceUserItemsPromise) {
      const requestEpoch = storeEpoch
      faceUserItemsPromise = apiGetFaceUserItemList()
        .then((data) => {
          if (requestEpoch !== storeEpoch) {
            return
          }
          faceUserItems.value = data || []
        })
        .catch((e) => {
          console.warn('[IM] 拉取个人表情失败', e)
          if (requestEpoch === storeEpoch) {
            faceUserItemsPromise = null
          }
          throw e
        })
    }
    return faceUserItemsPromise
  }

  /**
   * 添加个人表情；服务端对同 URL 抛 FACE_USER_ITEM_DUPLICATED 错误
   *
   * 来源：1. 用户在表情面板「+」上传图片  2. 长按消息「添加到表情」
   */
  async function addFaceUserItem(reqVO: ImFaceUserItemSaveReqVO): Promise<boolean> {
    const requestEpoch = storeEpoch
    const id = await apiCreateFaceUserItem(reqVO)
    if (!id) {
      return false
    }
    // 已切账号时跳过旧请求结果
    if (requestEpoch !== storeEpoch) {
      return false
    }
    // id 不在缓存里才插入；服务端唯一约束兜底了 race，本地理论上不会拿到重复 id
    if (!faceUserItems.value.some((item) => item.id === id)) {
      faceUserItems.value.unshift({
        id,
        url: reqVO.url,
        name: reqVO.name,
        width: reqVO.width,
        height: reqVO.height
      })
    }
    return true
  }

  /** 删除个人表情；本地立即移除 */
  async function removeFaceUserItem(id: number): Promise<boolean> {
    const requestEpoch = storeEpoch
    try {
      await apiDeleteFaceUserItem(id)
      // 已切账号时跳过旧请求结果
      if (requestEpoch !== storeEpoch) {
        return false
      }
      faceUserItems.value = faceUserItems.value.filter((item) => item.id !== id)
      return true
    } catch (e) {
      console.warn('[IM] 删除个人表情失败', { id }, e)
      return false
    }
  }

  /** 清空表情缓存 */
  function clear(): void {
    facePacks.value = []
    faceUserItems.value = []
    facePacksPromise = null
    faceUserItemsPromise = null
    storeEpoch++
  }

  return {
    facePacks,
    faceUserItems,
    ensureFacePackList,
    ensureFaceUserItemList,
    addFaceUserItem,
    removeFaceUserItem,
    clear
  }
})

/** 在 setup 外（路由守卫等）取 store 实例的工具方法 */
export const useFaceStoreWithOut = () => useFaceStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFaceStore, import.meta.hot))
}
