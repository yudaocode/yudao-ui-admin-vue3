<template>
  <div class="markdown-editor overflow-hidden b-1px border-solid border-[var(--el-border-color)]">
    <div
      class="flex min-h-42px items-center justify-between px-8px py-4px b-b-1 border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
    >
      <div class="flex items-center gap-2px">
        <el-tooltip v-for="action in toolbarActions" :key="action.name" :content="action.name">
          <el-button text class="!h-32px !w-32px !p-0" @click="insertSyntax(action)">
            <Icon :icon="action.icon" />
          </el-button>
        </el-tooltip>
      </div>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="edit">编辑</el-radio-button>
        <el-radio-button value="preview">预览</el-radio-button>
      </el-radio-group>
    </div>
    <!-- 编辑模式 -->
    <el-input
      v-show="mode === 'edit'"
      ref="inputRef"
      :model-value="content"
      type="textarea"
      resize="none"
      :placeholder="placeholder"
      :input-style="{ height }"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <!-- 预览模式 -->
    <el-scrollbar
      v-show="mode === 'preview'"
      :height="height"
      class="box-border p-16px bg-[var(--el-bg-color)]"
    >
      <MarkdownView
        v-if="content"
        :content="content"
        :html="html"
        :linkify="linkify"
        :breaks="breaks"
      />
      <el-empty v-else description="暂无可预览内容" :image-size="64" />
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import type { InputInstance } from 'element-plus'
import MarkdownView from '@/components/MarkdownView/index.vue'

/** Markdown 编辑器：工具栏快捷语法插入 + 编辑/预览切换 */
defineOptions({ name: 'MarkdownEditor' })

interface ToolbarAction {
  name: string
  icon: string
  prefix: string
  suffix: string
  placeholder: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    height?: string
    // 以下预览渲染选项同 markdown-it，默认关闭；调用方按保存时的渲染选项开启，使预览与保存结果一致
    html?: boolean // 是否渲染内嵌 HTML（预览经 DOMPurify 净化）
    linkify?: boolean // 是否自动识别链接
    breaks?: boolean // 是否将单个换行渲染为 <br>
  }>(),
  {
    placeholder: '请输入 Markdown 内容',
    height: '420px'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const mode = ref<'edit' | 'preview'>('edit')
const inputRef = ref<InputInstance>()
const content = computed(() => props.modelValue || '')

// 工具栏快捷语法配置
const toolbarActions: ToolbarAction[] = [
  { name: '标题', icon: 'lucide:heading-2', prefix: '## ', suffix: '', placeholder: '标题' },
  { name: '粗体', icon: 'lucide:bold', prefix: '**', suffix: '**', placeholder: '粗体文本' },
  { name: '斜体', icon: 'lucide:italic', prefix: '*', suffix: '*', placeholder: '斜体文本' },
  { name: '引用', icon: 'lucide:quote', prefix: '> ', suffix: '', placeholder: '引用内容' },
  {
    name: '链接',
    icon: 'lucide:link',
    prefix: '[',
    suffix: '](https://)',
    placeholder: '链接文字'
  },
  {
    name: '图片',
    icon: 'lucide:image',
    prefix: '![',
    suffix: '](https://)',
    placeholder: '图片描述'
  },
  { name: '代码', icon: 'lucide:code-2', prefix: '`', suffix: '`', placeholder: '代码' },
  { name: '无序列表', icon: 'lucide:list', prefix: '- ', suffix: '', placeholder: '列表项' }
]

// 在光标处插入快捷语法，有选中文本时包裹选中内容，否则填入占位文字
const insertSyntax = async (action: ToolbarAction) => {
  const textarea = inputRef.value?.textarea
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.slice(start, end) || action.placeholder
  const insertedText = `${action.prefix}${selectedText}${action.suffix}`
  const value = `${content.value.slice(0, start)}${insertedText}${content.value.slice(end)}`
  emit('update:modelValue', value)
  await nextTick()
  textarea.focus()
  textarea.setSelectionRange(
    start + action.prefix.length,
    start + action.prefix.length + selectedText.length
  )
}
</script>

<style scoped lang="scss">
/* 覆盖 element-plus textarea 内部样式，unocss 无法作用于深层节点 */
.markdown-editor {
  :deep(.el-textarea__inner) {
    border: 0;
    border-radius: 0;
    box-shadow: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    line-height: 1.7;
  }
}
</style>
