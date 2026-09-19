<template>
  <OaHomePanel title="我的笔记" v-loading="loading">
    <template #actions>
      <el-button link type="primary" @click="push('/oa/note')">更多</el-button>
    </template>
    <div v-if="loadError" class="mb-12px text-13px text-[var(--el-color-danger)]">
      加载失败，
      <el-button link type="primary" @click="getList">重新加载</el-button>
    </div>
    <el-empty v-if="list.length === 0" :image-size="56" description="暂无笔记" />
    <div
      v-for="item in list"
      v-else
      :key="item.id"
      class="flex min-h-50px items-center gap-12px border-b border-[var(--el-border-color-lighter)] py-8px"
    >
      <div class="min-w-0 flex-1">
        <div class="truncate font-500">{{ item.title }}</div>
        <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
          {{ item.content || '暂无内容' }}
        </div>
      </div>
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        {{ formatDate(item.createTime, 'MM-DD') }}
      </span>
    </div>
    <div v-hasPermi="['oa:note:create']" class="mt-14px flex gap-8px">
      <el-input
        v-model="quickNote"
        maxlength="255"
        placeholder="输入笔记内容"
        @keyup.enter="createQuickNote"
      />
      <el-button :loading="saving" type="primary" @click="createQuickNote">添加</el-button>
    </div>
  </OaHomePanel>
</template>

<script setup lang="ts">
import OaHomePanel from './OaHomePanel.vue'
import * as NoteApi from '@/api/oa/note'
import { formatDate } from '@/utils/formatTime'
import { OA_NOTE_TYPE, OA_PRIORITY } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaHomeNote' })

const { push } = useRouter() // 路由跳转
const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const list = ref<NoteApi.OaNoteVO[]>([]) // 笔记列表
const message = useMessage() // 消息弹窗
const quickNote = ref('') // 快捷笔记内容
const saving = ref(false) // 笔记保存中

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    list.value = (await NoteApi.getMyNotePage({ pageNo: 1, pageSize: 5 })).list
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 新增快捷笔记 */
async function createQuickNote() {
  if (saving.value) return
  const content = quickNote.value.trim()
  if (!content) {
    message.warning('请输入笔记内容')
    return
  }
  if (content.length < 10) {
    message.warning('笔记内容不能少于 10 个字')
    return
  }
  saving.value = true
  try {
    await NoteApi.createNote({
      type: OA_NOTE_TYPE.MINE,
      priority: OA_PRIORITY.NORMAL,
      title: content,
      content,
      fileUrls: []
    })
    message.success('笔记添加成功')
    quickNote.value = ''
    await getList()
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
