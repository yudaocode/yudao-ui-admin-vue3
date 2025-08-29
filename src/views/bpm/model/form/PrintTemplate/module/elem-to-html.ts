import { SlateElement } from '@wangeditor/editor'

function processRecordToHtml(elem: SlateElement, childrenHtml: string): string {
  return `<span data-w-e-type="process-record" data-w-e-is-void data-w-e-is-inline>流程记录</span>`
}

const conf = {
  type: 'process-record',
  elemToHtml: processRecordToHtml,
}

export default conf
