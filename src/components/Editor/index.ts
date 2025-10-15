import Editor from './src/Editor.vue'
import { IDomEditor } from '@wangeditor-next/editor'

export interface EditorExpose {
  getEditorRef: () => Promise<IDomEditor>
}

export { Editor }
