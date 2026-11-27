import { defineStore } from 'pinia'
import { store } from '../index'
// @ts-ignore
import { DictDataVO } from '@/api/system/dict/types'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
const { wsCache } = useCache('sessionStorage')
import { getSimpleDictDataList } from '@/api/system/dict/dict.data'

// 字典加载序号：初次加载与强制刷新共用，只采用最后一次请求的结果，避免较早的响应覆盖较新的数据
let dictLoadSeq = 0

/** 将字典数据列表按 dictType 分组 */
const buildDictMap = (dictDataList: DictDataVO[]) => {
  const dictDataMap = new Map<string, any>()
  for (const dictData of dictDataList) {
    // 获得 dictType 层级
    const enumValueObj = dictDataMap[dictData.dictType]
    if (!enumValueObj) {
      dictDataMap[dictData.dictType] = []
    }
    // 处理 dictValue 层级
    dictDataMap[dictData.dictType].push({
      value: dictData.value,
      label: dictData.label,
      colorType: dictData.colorType,
      cssClass: dictData.cssClass
    })
  }
  return dictDataMap
}

export interface DictValueType {
  value: any
  label: string
  clorType?: string
  cssClass?: string
}
export interface DictTypeType {
  dictType: string
  dictValue: DictValueType[]
}
export interface DictState {
  dictMap: Map<string, any>
  isSetDict: boolean
}

export const useDictStore = defineStore('dict', {
  state: (): DictState => ({
    dictMap: new Map<string, any>(),
    isSetDict: false
  }),
  getters: {
    getDictMap(): Recordable {
      const dictMap = wsCache.get(CACHE_KEY.DICT_CACHE)
      if (dictMap) {
        this.dictMap = dictMap
      }
      return this.dictMap
    },
    getIsSetDict(): boolean {
      return this.isSetDict
    }
  },
  actions: {
    async setDictMap() {
      const dictMap = wsCache.get(CACHE_KEY.DICT_CACHE)
      if (dictMap) {
        this.dictMap = dictMap
        this.isSetDict = true
      } else {
        await this.loadDictMap(false)
      }
    },
    getDictByType(type: string) {
      if (!this.isSetDict) {
        this.setDictMap()
      }
      return this.dictMap[type]
    },
    async resetDict() {
      wsCache.delete(CACHE_KEY.DICT_CACHE)
      // 强制刷新时，返回空列表同样覆盖，清除旧的字典数据
      await this.loadDictMap(true)
    },
    /** 请求字典数据并写入；请求失败或已有更新的请求时不写入，保留原有数据 */
    async loadDictMap(allowEmpty: boolean) {
      const seq = ++dictLoadSeq
      const res: DictDataVO[] | undefined = await getSimpleDictDataList()
      if (seq !== dictLoadSeq) {
        return
      }
      if (!allowEmpty && (!res || res.length === 0)) {
        return
      }
      // 设置数据
      const dictDataMap = buildDictMap(res || [])
      this.dictMap = dictDataMap
      this.isSetDict = true
      wsCache.set(CACHE_KEY.DICT_CACHE, dictDataMap, { exp: 60 }) // 60 秒 过期
    }
  }
})

export const useDictStoreWithOut = () => {
  return useDictStore(store)
}
