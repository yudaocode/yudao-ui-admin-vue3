import Editor from './src/Editor.vue'
import type { IDomEditor } from '@wangeditor-next/editor'

export interface EditorExpose {
  getEditorRef: () => Promise<IDomEditor>
}

export { Editor }
