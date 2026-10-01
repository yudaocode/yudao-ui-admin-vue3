<template>
  <div
    v-loading="loading"
    class="min-h-480px min-w-0 flex flex-1 flex-col overflow-hidden rounded-6px border border-[var(--el-border-color-light)] border-solid"
  >
    <!-- 未选中 -->
    <el-empty v-if="!file" description="请选择左侧文件进行编辑" />
    <!-- 选中目录 -->
    <el-empty
      v-else-if="file.type === Ai1SkillFileTypeEnum.DIRECTORY"
      :description="`目录[${file.name}]下可新建文件或子目录`"
    />
    <!-- 选中文件 -->
    <template v-else>
      <div
        class="flex items-center justify-between px-12px py-8px border-b border-b-[var(--el-border-color-lighter)] border-b-solid"
      >
        <span class="flex items-center gap-8px font-600">
          {{ file.name }}
          <el-tag v-if="file.fileType" size="small">{{ file.fileType }}</el-tag>
          <el-tag v-if="file.locked" size="small" type="warning">固定</el-tag>
        </span>
        <div class="flex items-center gap-12px">
          <el-radio-group v-if="isMarkdown" v-model="editorMode">
            <el-radio-button value="edit">编辑</el-radio-button>
            <el-radio-button value="preview">预览</el-radio-button>
          </el-radio-group>
          <el-button
            type="primary"
            :loading="saving"
            v-hasPermi="['ai1:skill:update']"
            @click="handleSave"
          >
            保存内容
          </el-button>
        </div>
      </div>
      <div v-show="editorMode === 'edit'" class="flex-1 p-10px">
        <el-input
          v-model="content"
          type="textarea"
          :maxlength="16777215"
          :rows="editorRows"
          :input-style="{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }"
          spellcheck="false"
        />
      </div>
      <!-- Markdown 预览：MarkdownView 正文默认 16px，缩放到与编辑区接近的字号 -->
      <div
        v-if="editorMode === 'preview'"
        class="max-h-[calc(100vh-260px)] flex-1 overflow-auto px-16px py-12px [zoom:0.85]"
      >
        <MarkdownView :content="content" />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import MarkdownView from '@/components/MarkdownView/index.vue'
import { SkillFileApi, SkillFile } from '@/api/ai1/skill'
import { Ai1SkillFileTypeEnum } from '@/views/ai1/utils/constants'

/** AI1 SKILL 文件编辑器 */
defineOptions({ name: 'Ai1SkillFileEditor' })

const props = defineProps<{
  file?: SkillFile // 选中的节点
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 内容的加载中
const saving = ref(false) // 保存的加载中
const content = ref('') // 编辑器内容
const editorMode = ref<'edit' | 'preview'>('edit') // 编辑模式：edit - 编辑；preview - 预览

/** 是否为 Markdown 文件 */
const isMarkdown = computed(() => props.file?.fileType === 'md')
/** 编辑框行数 */
const editorRows = Math.max(18, Math.floor((window.innerHeight - 320) / 22))

/** 加载文件内容 */
const loadContent = async (id: number) => {
  loading.value = true
  try {
    const data = await SkillFileApi.getSkillFile(id)
    if (props.file?.id === id) {
      content.value = data.content ?? ''
    }
  } finally {
    loading.value = false
  }
}

/** 监听选中节点，切换文件时加载内容 */
watch(
  () => props.file?.id,
  (id) => {
    editorMode.value = 'edit'
    content.value = ''
    if (id && props.file?.type === Ai1SkillFileTypeEnum.FILE) {
      loadContent(id)
    }
  },
  { immediate: true }
)

/** 保存文件内容 */
const handleSave = async () => {
  if (!props.file) {
    return
  }
  saving.value = true
  try {
    await SkillFileApi.updateSkillFileContent({ id: props.file.id, content: content.value })
    message.success(t('common.updateSuccess'))
  } finally {
    saving.value = false
  }
}
</script>
