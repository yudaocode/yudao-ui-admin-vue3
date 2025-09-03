import { DOMElement } from './utils/dom'
import { IDomEditor, SlateDescendant, SlateElement } from '@wangeditor/editor'

function parseHtml(
  _elem: DOMElement,
  _children: SlateDescendant[],
  _editor: IDomEditor
): SlateElement {
  return {
    // TODO @lesan：这里有个红色告警，可以去掉哇？
    type: 'process-record',
    children: [{ text: '' }]
  }
}

const parseHtmlConf = {
  selector: 'span[data-w-e-type="process-record"]',
  parseElemHtml: parseHtml
}

export default parseHtmlConf
