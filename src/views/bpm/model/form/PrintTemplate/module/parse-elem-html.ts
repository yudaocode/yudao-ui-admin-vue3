import { DOMElement } from './utils/dom'
import { IDomEditor, SlateDescendant, SlateElement } from '@wangeditor/editor'

function parseHtml(
  elem: DOMElement,
  children: SlateDescendant[],
  editor: IDomEditor
): SlateElement {
  return {
    type: 'process-record',
    children: [{ text: '' }],
  }
}

const parseHtmlConf = {
  selector: 'span[data-w-e-type="process-record"]',
  parseElemHtml: parseHtml,
}

export default parseHtmlConf
