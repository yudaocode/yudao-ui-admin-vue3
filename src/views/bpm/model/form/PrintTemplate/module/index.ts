import { IModuleConf } from '@wangeditor-next/editor'
import withProcessRecord from './plugin'
import renderElemConf from './render-elem'
import elemToHtmlConf from './elem-to-html'
import parseHtmlConf from './parse-elem-html'
import processRecordMenu from './menu/ProcessRecordMenu'

// 可参考 wangEditor 官方文档进行自定义扩展插件：https://www.wangeditor.com/v5/development.html#%E5%AE%9A%E4%B9%89%E6%96%B0%E5%85%83%E7%B4%A0
const module: Partial<IModuleConf> = {
  editorPlugin: withProcessRecord,
  renderElems: [renderElemConf],
  elemsToHtml: [elemToHtmlConf],
  parseElemsHtml: [parseHtmlConf],
  menus: [processRecordMenu]
}

export default module
