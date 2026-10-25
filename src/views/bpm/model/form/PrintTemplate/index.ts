import { Boot } from '@wangeditor-next/editor'
import processRecordModule from './module'
import mentionModule from '@wangeditor-next/plugin-mention'

let registered = false // 是否已注册

// 注册：要在创建编辑器之前注册，且只能注册一次，不可重复注册
// 由使用 wangEditor 的组件（Editor、PrintTemplate）在创建编辑器前调用，避免 wangEditor 进入首屏
export const setupWangEditorPlugin = () => {
  if (registered) {
    return
  }
  Boot.registerModule(processRecordModule)
  Boot.registerModule(mentionModule)
  registered = true
}
