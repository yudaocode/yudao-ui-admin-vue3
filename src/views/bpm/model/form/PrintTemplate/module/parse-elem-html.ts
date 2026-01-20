import { DOMElement } from './utils/dom'
import { IDomEditor, SlateDescendant, SlateElement } from '@wangeditor-next/editor'

/**
 * 解析 HTML 字符串，生成“附件”元素
 * @param domElem HTML 对应的 DOM Element
 * @param children 子节点
 * @param editor editor 实例
 * @returns “附件”元素，如上文的 myResume
 */
function parseHtml(
  _domElem: DOMElement,
  _children: SlateDescendant[],
  _editor: IDomEditor
): SlateElement {
  // TS 语法


  // 生成“流程记录”元素（按照此前约定的数据结构）
  const processRecord = {
    type: 'process-record',
    children: [{ text: '' }], // void node 必须有 children ，其中有一个空字符串，重要！！！
  }

  return processRecord
}

const parseHtmlConf = {
  selector: 'span[data-w-e-type="process-record"]',
  parseElemHtml: parseHtml
}

export default parseHtmlConf
