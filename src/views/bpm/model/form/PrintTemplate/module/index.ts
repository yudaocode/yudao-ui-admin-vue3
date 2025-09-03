import { IModuleConf } from '@wangeditor/editor'
import withProcessRecord from './plugin'
import renderElemConf from './render-elem'
import elemToHtmlConf from './elem-to-html'
import parseHtmlConf from './parse-elem-html'
import processRecordMenu from './menu/ProcessRecordMenu'

// TODO @lesan：PrintTemplate 是参考了哪些文档哇？要不要在 index.ts 稍微写点注释，方便大家理解；
const module: Partial<IModuleConf> = {
  editorPlugin: withProcessRecord,
  renderElems: [renderElemConf],
  elemsToHtml: [elemToHtmlConf],
  parseElemsHtml: [parseHtmlConf],
  menus: [processRecordMenu]
}

export default module
