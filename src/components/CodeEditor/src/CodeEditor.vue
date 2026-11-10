<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type * as Monaco from 'monaco-editor'
import { omit } from 'lodash-es'
import { useMonacoEditor } from '@/hooks/web/useMonacoEditor'
import { languageOptions, themeOptions } from './config/config'

defineOptions({ name: 'CodeEditor' })

const props = withDefaults(
  defineProps<{
    width?: string | number
    height?: string | number
    languageSelector?: boolean
    language?: string
    themeSelector?: boolean
    theme?: string
    // monaco 编辑器配置（含 readOnly 等），变化时动态生效；language / theme 以对应属性为准。
    // model 仅初始化时读取，由调用方负责生命周期，组件卸载不会释放
    editorOption?: object
    // 编辑器内容以 v-model 为准，传入 editorOption.model 时也必须绑定 v-model
    modelValue: string
  }>(),
  {
    width: '100%',
    height: '100%',
    languageSelector: true,
    language: 'javascript',
    themeSelector: true,
    theme: 'vs-dark',
    editorOption: () => ({}),
    modelValue: ''
  }
)

const emits = defineEmits<{
  (e: 'blur'): void
  (e: 'update:modelValue', val: string): void
}>()

const monacoEditorStyle = computed(() => {
  return {
    width: typeof props.width === 'string' ? props.width : props.width + 'px',
    height: typeof props.height === 'string' ? props.height : props.height + 'px'
  }
})

const {
  monacoEditorRef,
  createEditor,
  track,
  updateVal,
  updateOptions,
  getEditor,
  formatDoc,
  changeLanguage,
  changeTheme
} = useMonacoEditor(props.language)

const localLanguage = ref(props.language)
const localTheme = ref(props.theme)

// 动态更新的配置：model / value / language / theme 不经 updateOptions 修改
const getDynamicOptions = (): Monaco.editor.IEditorOptions =>
  omit(props.editorOption, ['model', 'value', 'language', 'theme'])

// 外部写入编辑器内容期间不回发 update:modelValue
let applyingValue = false

function updateMonacoVal(val: string) {
  if (val === getEditor()?.getValue()) return
  applyingValue = true
  try {
    updateVal(val)
  } finally {
    applyingValue = false
  }
}

onMounted(async () => {
  if (!monacoEditorRef.value) return
  // monaco 异步加载完成后才读取配置，加载期间属性的变化以最新值为准
  const monacoEditor = await createEditor(() => ({
    ...getDynamicOptions(),
    model: (props.editorOption as Monaco.editor.IStandaloneEditorConstructionOptions).model,
    value: props.modelValue,
    language: localLanguage.value,
    // monaco 主题全局生效：同页多个编辑器以最后设置的主题为准
    theme: localTheme.value
  }))
  if (!monacoEditor) return
  // 调用方传入的 model 与 v-model 值不同时，以 v-model 为准
  updateMonacoVal(props.modelValue)
  track(
    monacoEditor.onDidChangeModelContent(() => {
      if (!applyingValue) emits('update:modelValue', monacoEditor.getValue())
    })
  )
  track(
    monacoEditor.onDidBlurEditorText(() => {
      emits('blur')
    })
  )
})

watch(
  () => props.modelValue,
  (val) => {
    updateMonacoVal(val)
  }
)

watch(
  () => props.language,
  (newLanguage) => {
    localLanguage.value = newLanguage
  }
)

watch(localLanguage, (newLanguage) => {
  changeLanguage(newLanguage)
})

watch(
  () => props.theme,
  (newTheme) => {
    localTheme.value = newTheme
  }
)

watch(localTheme, (newTheme) => {
  changeTheme(newTheme)
})

watch(
  getDynamicOptions,
  () => {
    updateOptions(getDynamicOptions())
  },
  { deep: true }
)

defineExpose({ updateOptions, getEditor, formatDoc })
</script>

<template>
  <ElForm :inline="true">
    <ElFormItem v-if="languageSelector" label="language" class="w-30% mb-5px!">
      <ElSelect
        v-model="localLanguage"
        placeholder="Please select language"
        size="small"
        filterable
      >
        <ElOption
          v-for="item in languageOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem v-if="themeSelector" label="theme" class="w-30% mb-5px!">
      <ElSelect v-model="localTheme" placeholder="Please select theme" size="small" filterable>
        <ElOption
          v-for="item in themeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
  </ElForm>
  <div ref="monacoEditorRef" :style="monacoEditorStyle"></div>
</template>
