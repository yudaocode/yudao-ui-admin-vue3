import { IButtonMenu, IDomEditor } from '@wangeditor-next/editor'

class ProcessRecordMenu implements IButtonMenu {
  readonly tag: string
  readonly title: string

  constructor() {
    this.title = '流程记录'
    this.tag = 'button'
  }

  getValue(_editor: IDomEditor): string {
    return ''
  }

  isActive(_editor: IDomEditor): boolean {
    return false
  }

  isDisabled(_editor: IDomEditor): boolean {
    return false
  }

  exec(editor: IDomEditor, _value: string) {
    if (this.isDisabled(editor)) return
    const processRecordElem = {
      type: 'process-record',
      children: [{ text: '' }]
    }
    editor.insertNode(processRecordElem)
    editor.move(1)
  }
}

const ProcessRecordMenuConf = {
  key: 'ProcessRecordMenu',
  factory() {
    return new ProcessRecordMenu()
  }
}

export default ProcessRecordMenuConf
