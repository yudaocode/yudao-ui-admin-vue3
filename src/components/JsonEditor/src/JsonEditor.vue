<template>
  <div ref="jsonEditorContainer" class="json-editor" :style="{ height }"></div>
</template>
<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

// 高度跟随 props 变化
const height = computed(() => props.height)

// 读取编辑器当前 JSON；code / text 模式下文本草稿无法解析（如输入到一半）时 valid 为 false
const readEditorJson = (): { valid: boolean; value?: any } => {
  try {
    return { valid: true, value: jsonEditor?.get() }
  } catch {
    return { valid: false }
  }
}

// v-model 未设值（undefined、''）时沿用 SDK 的空对象初值；false / 0 / null 为合法 JSON，原样使用
const getModelJson = () => {
  return jsonObj.value === undefined || jsonObj.value === '' ? {} : jsonObj.value
}

// 编辑器本次写回 v-model 的 JSON 文本（仅在同一轮更新内有效）：其回声到达时不再回写编辑器，避免覆盖其后输入的（可能无效的）草稿
let pendingEchoJson: string | undefined

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
      // 草稿暂时无效时不写回 v-model、不触发 change，保留最近一次有效值
      const current = readEditorJson()
      if (!current.valid) return
      const echoJson = JSON.stringify(current.value)
      pendingEchoJson = echoJson
      jsonObj.value = current.value
      // 回声只在本次写回触发的同一轮更新中有效：父级未采纳（如受控忽略）时随后清除，不吞掉之后真实的父级赋值
      nextTick(() => {
        if (pendingEchoJson === echoJson) pendingEchoJson = undefined
      })
      emits('change', current.value)
    },
    onValidationError: (errors: any) => {
      emits('error', errors)
    },
    ...props.options
  } as JSONEditorOptions

  // 创建JSONEditor实例
  jsonEditor = new JSONEditor(jsonEditorContainer.value, options)

  // 设置初始值：false / 0 / null 也是合法 JSON；undefined、'' 保持 SDK 空初值
  if (jsonObj.value !== undefined && jsonObj.value !== '') {
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

    // 编辑器自身写回的回声（只消费一次）：编辑器已是该值或之后又有更新的草稿，不回写
    const newJson = JSON.stringify(newValue)
    const isEcho = pendingEchoJson !== undefined && newJson === pendingEchoJson
    pendingEchoJson = undefined
    if (isEcho) return

    try {
      // 防止无限循环更新：内容相同时不更新；当前草稿无效时以父级值覆盖（如取消编辑时重置）
      const current = readEditorJson()
      if (!current.valid || JSON.stringify(current.value) !== newJson) {
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
      try {
        jsonEditor.setMode(newMode)
      } catch (error) {
        // SDK 切换前需解析当前文本；草稿无效时先恢复为 v-model 最近一次有效值（空值为空对象）再切换，
        // 避免父级切回只读（view）时停留在可编辑模式
        if (readEditorJson().valid) throw error
        jsonEditor.set(getModelJson())
        jsonEditor.setMode(newMode)
      }
      if (newMode === 'view') {
        jsonEditor.expandAll() // 与初始化一致，view 模式默认展开全部
      }
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
