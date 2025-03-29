<template>
  <div ref="jsonEditorContainer" class="json-editor" :style="{ height }"></div>
</template>
<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import JSONEditor, { JSONEditorMode, JSONEditorOptions } from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import { JsonEditorEmits, JsonEditorExpose, JsonEditorProps } from '../types'

/** 基于 https://github.com/josdejong/jsoneditor 二次封装组件，提供 JSON 编辑器功能。 */
defineOptions({ name: 'JsonEditor' })

const props = withDefaults(defineProps<JsonEditorProps>(), {
  mode: 'view' as JSONEditorMode,
  height: '400px',
  showModeSelection: false,
  showNavigationBar: false,
  showStatusBar: false,
  showMainMenuBar: true
})

const emits = defineEmits<JsonEditorEmits>()
const jsonObj = useVModel(props, 'modelValue', emits) as Ref<any>
const jsonEditorContainer = ref<HTMLElement | null>(null)
let jsonEditor: JSONEditor | null = null

// 设置默认值
const height = props.height

// 初始化JSONEditor
const initJsonEditor = () => {
  if (!jsonEditorContainer.value) return

  // 合并默认配置和用户自定义配置
  const options: JSONEditorOptions = {
    mode: props.mode,
    modes: props.showModeSelection
      ? (['tree', 'code', 'form', 'text', 'view', 'preview'] as JSONEditorMode[])
      : undefined,
    navigationBar: props.showNavigationBar,
    statusBar: props.showStatusBar,
    mainMenuBar: props.showMainMenuBar,
    onChange: () => {
      jsonObj.value = jsonEditor?.get()
      emits('change', jsonEditor?.get())
    },
    onValidationError: (errors: any) => {
      emits('error', errors)
    },
    ...props.options
  } as JSONEditorOptions

  // 创建JSONEditor实例
  jsonEditor = new JSONEditor(jsonEditorContainer.value, options)

  // 设置初始值
  if (jsonObj.value) {
    jsonEditor.set(jsonObj.value)
  }

  if (props.mode === 'view') {
    jsonEditor?.expandAll() // 默认展开全部
  }
}

// 监听数据变化
watch(
  () => jsonObj.value,
  (newValue) => {
    if (!jsonEditor) return

    try {
      // 防止无限循环更新
      const currentJson = jsonEditor.get()
      if (JSON.stringify(currentJson) !== JSON.stringify(newValue)) {
        jsonEditor.update(newValue)
      }
    } catch (error) {
      console.error('JSON更新失败:', error)
    }
  },
  { deep: true }
)

// 监听模式变化
watch(
  () => props.mode,
  (newMode) => {
    if (!jsonEditor) return
    try {
      jsonEditor.setMode(newMode)
    } catch (error) {
      console.error('切换模式失败:', error)
    }
  }
)

// 生命周期钩子
onMounted(() => {
  initJsonEditor()
})

onBeforeUnmount(() => {
  if (jsonEditor) {
    jsonEditor.destroy()
    jsonEditor = null
  }
})

// 暴露方法
defineExpose<JsonEditorExpose>({
  // 获取编辑器实例，以便可以调用更多JSONEditor的原生方法
  getEditor: () => jsonEditor
})
</script>

<style lang="scss" scoped>
/* 隐藏 Ace 编辑器的 powered by ace 标记 */
:deep(.jsoneditor-menu) {
  /* 隐藏 powered by ace 标记 */
  .jsoneditor-poweredBy {
    display: none !important;
  }
}
</style>
