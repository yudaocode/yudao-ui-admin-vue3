<template>
  <!--富文本编辑器组件-->
  <el-row>
    <Editor v-model="content" :editor-config="editorConfig" />
  </el-row>
</template>
<script lang="ts" name="DescriptionForm" setup>
import { Editor } from '@/components/Editor'
import { createEditorConfig } from '@/views/mp/draft/editor-config'
// TODO 模拟参数
const content = ref('')
const editorConfig = createEditorConfig('', 1)
</script>
