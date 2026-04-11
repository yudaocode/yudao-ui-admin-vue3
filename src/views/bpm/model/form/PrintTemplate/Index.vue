<script setup lang="ts">
import { Editor, Toolbar } from '@wangeditor-next/editor-for-vue'
import { IDomEditor } from '@wangeditor-next/editor'
import MentionModal from './MentionModal.vue'

const emit = defineEmits(['confirm'])

// @mention 相关
const isShowModal = ref(false)
const showModal = () => {
  isShowModal.value = true
}
const hideModal = () => {
  isShowModal.value = false
}
const insertMention = (id: any, name: any) => {
  const mentionNode = {
    type: 'mention',
    value: name,
    info: { id },
    children: [{ text: '' }]
  }
  const editor = editorRef.value
  if (editor) {
    editor.restoreSelection()
    editor.deleteBackward('character')
    editor.insertNode(mentionNode)
    editor.move(1)
  }
}

// Dialog 相关
const dialogVisible = ref(false)
const open = async (template: string) => {
  dialogVisible.value = true
  valueHtml.value = template
}
defineExpose({ open })
const handleConfirm = () => {
  emit('confirm', valueHtml.value)
  dialogVisible.value = false
}

// Editor 相关
const editorRef = shallowRef<IDomEditor>()
const editorId = ref('wangEditor-1')
const toolbarConfig = {
  excludeKeys: ['group-video'],
  insertKeys: {
    index: 31,
    keys: ['ProcessRecordMenu']
  }
}
const editorConfig = {
  placeholder: '请输入内容...',
  EXTEND_CONF: {
    mentionConfig: {
      showModal,
      hideModal
    }
  }
}
const valueHtml = ref()
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

/** 初始化 */
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) {
    return
  }
  editor.destroy()
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="自定义模板" fullscreen>
    <div style="margin: 0 10px">
      <el-alert
        title="输入 @ 可选择插入流程表单选项和默认选项"
        type="info"
        show-icon
        :closable="false"
      />
    </div>
    <!-- TODO @unocss 简化 style -->
    <div style=" margin: 10px;border: 1px solid #ccc">
      <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editorRef"
        :editorId="editorId"
        :defaultConfig="toolbarConfig"
      />
      <Editor
        style="height: 500px; overflow-y: hidden"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :editorId="editorId"
        @on-created="handleCreated"
      />
      <MentionModal
        v-if="isShowModal"
        @hide-mention-modal="hideModal"
        @insert-mention="insertMention"
      />
    </div>
    <div style=" float: right;margin-right: 10px">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleConfirm">确 定</el-button>
    </div>
  </el-dialog>
</template>

<style src="@wangeditor-next/editor/dist/css/style.css"></style>
