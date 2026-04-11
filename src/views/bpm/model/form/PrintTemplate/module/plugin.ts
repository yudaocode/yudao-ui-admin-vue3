import { DomEditor, IDomEditor } from '@wangeditor-next/editor'

function withProcessRecord<T extends IDomEditor>(editor: T) {
  const { isInline, isVoid } = editor
  const newEditor = editor

  newEditor.isInline = (elem) => {
    const type = DomEditor.getNodeType(elem)
    if (type === 'process-record') {
      return true
    }

    return isInline(elem)
  }

  newEditor.isVoid = (elem) => {
    const type = DomEditor.getNodeType(elem)
    if (type === 'process-record') {
      return true
    }

    return isVoid(elem)
  }

  return newEditor
}

export default withProcessRecord
