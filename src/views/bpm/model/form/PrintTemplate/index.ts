import { Boot } from '@wangeditor/editor'
import processRecordModule from './module'
import mentionModule from '@wangeditor/plugin-mention'

// 注册：要在创建编辑器之前注册，且只能注册一次，不可重复注册
export const setupWangEditorPlugin = () => {
  Boot.registerModule(processRecordModule)
  Boot.registerModule(mentionModule)
}
