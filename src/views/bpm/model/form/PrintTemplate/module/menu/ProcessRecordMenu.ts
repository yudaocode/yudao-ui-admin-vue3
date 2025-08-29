import { IButtonMenu, IDomEditor } from '@wangeditor/editor'

class ProcessRecordMenu implements IButtonMenu {
  readonly tag: string;
  readonly title: string;

  constructor() {
    this.title = '流程记录'
    this.tag = 'button'
  }

  getValue(editor: IDomEditor): string {
    return ''
  }

  isActive(editor: IDomEditor): boolean {
    return false
  }

  isDisabled(editor: IDomEditor): boolean {
    return false
  }

  exec(editor: IDomEditor, value: string) {
    if (this.isDisabled(editor)) return
    const processRecordElem = {
      type: 'process-record',
      children: [{ text: '' }],
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
