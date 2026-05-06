import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { store } from '@/store'

import {
  getFacePackList as apiGetFacePackList,
  getMyFaceUserItemList as apiGetMyFaceUserItemList,
  createFaceUserItem as apiCreateFaceUserItem,
  deleteFaceUserItem as apiDeleteFaceUserItem,
  type ImFacePackUserVO,
  type ImFaceUserItemVO,
  type ImFaceUserItemSaveReqVO
} from '@/api/im/face'

/**
 * IM 表情面板数据 store（系统表情包 + 个人表情）
 *
 * 不持久化：数据小、低频；每次进 IM 第一次打开表情面板时按需拉，关 tab 即丢弃。
 * 系统包面板在面板首次展开时 ensureFacePacks；个人表情在切到「收藏」tab 或要发送 / 添加时 ensureFaceUserItems。
 */
export const useFaceStore = defineStore('imFace', () => {

  /** 系统表情包列表（含每个包的 items）；运营管理后台维护 */
  const facePacks = ref<ImFacePackUserVO[]>([])
  /** 个人表情包列表（用户长按「添加到表情」/ 上传产生） */
  const faceUserItems = ref<ImFaceUserItemVO[]>([])

  /** 已成功拉取过系统包；后续切 tab 不再重复请求 */
  const facePacksLoaded = ref(false)
  /** 已成功拉取过个人表情 */
  const faceUserItemsLoaded = ref(false)

  /** 拉取系统表情包；同 promise 去重，并发调用共用一个请求 */
  let facePacksFetching: Promise<void> | null = null
  /** 按需拉取系统表情包（已拉过则直接复用） */
  async function ensureFacePacks(): Promise<void> {
    if (facePacksLoaded.value) {
      return
    }
    if (facePacksFetching) {
      return facePacksFetching
    }
    facePacksFetching = (async () => {
      try {
        facePacks.value = (await apiGetFacePackList()) || []
        facePacksLoaded.value = true
      } catch (e) {
        console.warn('[IM] 拉取表情包失败', e)
      } finally {
        facePacksFetching = null
      }
    })()
    return facePacksFetching
  }

  // TODO @AI：是不是也要注释下，风格一致；
  let faceUserItemsFetching: Promise<void> | null = null
  /** 按需拉取个人表情 */
  async function ensureFaceUserItems(): Promise<void> {
    if (faceUserItemsLoaded.value) {
      return
    }
    if (faceUserItemsFetching) {
      return faceUserItemsFetching
    }
    faceUserItemsFetching = (async () => {
      try {
        faceUserItems.value = (await apiGetMyFaceUserItemList()) || []
        faceUserItemsLoaded.value = true
      } catch (e) {
        console.warn('[IM] 拉取个人表情失败', e)
      } finally {
        faceUserItemsFetching = null
      }
    })()
    return faceUserItemsFetching
  }

  /**
   * 添加个人表情；服务端对同 URL 幂等返回旧 id，本地缓存按 id 去重
   *
   * 来源：1. 用户在表情面板「+」上传图片  2. 长按消息「添加到表情」（带 sourceMessageId）
   */
  async function addFaceUserItem(reqVO: ImFaceUserItemSaveReqVO): Promise<number | undefined> {
    try {
      const id = await apiCreateFaceUserItem(reqVO)
      if (!id) {
        return undefined
      }
      // id 不在缓存里才插入，避免重复添加同张图触发列表里出现两条
      if (!faceUserItems.value.some((item) => item.id === id)) {
        faceUserItems.value.unshift({
          id,
          url: reqVO.url,
          name: reqVO.name,
          width: reqVO.width,
          height: reqVO.height
        })
      }
      return id
    } catch (e) {
      console.warn('[IM] 添加个人表情失败', e)
      // TODO @AI：应该把参数打印出来，reqVO；
      return undefined
    }
  }

  /** 删除个人表情；本地立即移除 */
  async function removeFaceUserItem(id: number): Promise<boolean> {
    try {
      await apiDeleteFaceUserItem(id)
      faceUserItems.value = faceUserItems.value.filter((item) => item.id !== id)
      return true
    } catch (e) {
      // TODO @AI：应该把参数打印出来，id；
      console.warn('[IM] 删除个人表情失败', e)
      return false
    }
  }

  /** 切账号 / 退出 IM 时清空缓存，避免下个用户看到上一用户的个人表情 */
  function reset(): void {
    facePacks.value = []
    faceUserItems.value = []
    facePacksLoaded.value = false
    faceUserItemsLoaded.value = false
  }

  return {
    facePacks,
    faceUserItems,
    ensureFacePacks,
    ensureFaceUserItems,
    addFaceUserItem,
    removeFaceUserItem,
    reset
  }
})

/** 在 setup 外（路由守卫等）取 store 实例的工具方法 */
export const useFaceStoreWithOut = () => useFaceStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFaceStore, import.meta.hot))
}
