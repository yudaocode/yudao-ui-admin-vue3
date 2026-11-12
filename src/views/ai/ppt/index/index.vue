<!-- AI PPT：用户创作页 -->
<template>
  <div class="h-full flex gap-16px overflow-hidden">
    <!-- 左：创建表单 -->
    <div class="h-full w-420px flex-shrink-0">
      <PptCreatePanel @submitted="handleSubmitted" />
    </div>

    <!-- 右：我的 PPT -->
    <ContentWrap
      class="h-full min-w-0 flex-1"
      :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
    >
      <div class="mb-12px flex items-center justify-between">
        <div>
          <span class="text-16px font-bold">我的 PPT</span>
          <span class="ml-8px text-12px text-[var(--el-text-color-secondary)]">
            共 {{ total }} 条<template v-if="hasRunning"> · 有生成中任务时每 3 秒刷新</template>
          </span>
        </div>
        <el-button link type="primary" :loading="loading" @click="getList()">
          <Icon icon="ep:refresh" class="mr-4px" /> 刷新
        </el-button>
      </div>
      <div v-loading="loading" class="min-h-0 flex-1 overflow-y-auto pr-4px">
        <el-empty v-if="list.length === 0" description="暂无任务，在左侧创建任务吧～" />
        <div v-else class="flex flex-col gap-10px">
          <div
            v-for="item in list"
            :key="item.id"
            class="flex gap-14px border border-[var(--el-border-color-lighter)] rounded-8px border-solid p-12px hover:shadow-[var(--el-box-shadow-light)]"
          >
            <!-- 封面 -->
            <div
              class="h-90px w-160px flex-shrink-0 cursor-pointer overflow-hidden rounded-6px bg-[var(--el-fill-color-light)]"
              @click="openPreview(item)"
            >
              <el-image
                v-if="item.coverUrl"
                :src="item.coverUrl"
                fit="cover"
                class="h-full w-full"
                loading="lazy"
              />
              <div
                v-else-if="item.status === AiPptStatusEnum.IN_PROGRESS"
                class="h-full w-full flex flex-col items-center justify-center gap-4px text-12px text-[var(--el-text-color-secondary)]"
              >
                <Icon icon="ep:loading" class="is-loading text-[var(--el-color-primary)]" />
                正在生成中
              </div>
              <div
                v-else
                class="h-full w-full flex items-center justify-center text-12px text-[var(--el-text-color-placeholder)]"
              >
                暂无预览
              </div>
            </div>
            <!-- 信息、操作 -->
            <div class="min-w-0 flex flex-1 flex-col gap-8px">
              <div class="flex items-start justify-between gap-12px">
                <span
                  class="line-clamp-2 min-w-0 flex-1 cursor-pointer text-15px font-medium"
                  @click="openPreview(item)"
                >
                  {{ item.title }}
                </span>
                <span class="flex-shrink-0 text-12px text-[var(--el-text-color-placeholder)]">
                  {{ formatDate(item.createTime, 'MM-DD HH:mm') }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-12px text-12px">
                <div class="min-w-0 flex items-center gap-12px">
                  <dict-tag :type="DICT_TYPE.AI_PPT_STATUS" :value="item.status" />
                  <span>{{ item.finishCount }} / {{ item.slideCount }} 页</span>
                  <span
                    v-if="item.status === AiPptStatusEnum.IN_PROGRESS"
                    class="truncate text-[var(--el-text-color-secondary)]"
                  >
                    {{ getProgressText(item) }}
                  </span>
                </div>
                <div class="flex flex-shrink-0 items-center gap-12px">
                  <el-popover placement="bottom-start" :width="340" trigger="click">
                    <template #reference>
                      <el-button link type="primary" size="small">查看提示词</el-button>
                    </template>
                    <div
                      class="max-h-240px overflow-y-auto whitespace-pre-wrap break-all text-13px"
                    >
                      {{ item.prompt || '（无补充提示）' }}
                    </div>
                  </el-popover>
                  <el-button link size="small" @click="openOutline(item)">查看大纲</el-button>
                  <el-button
                    v-if="item.status === AiPptStatusEnum.FAIL"
                    link
                    type="primary"
                    size="small"
                    :loading="resumingId === item.id"
                    @click="handleResume(item)"
                  >
                    继续生成
                  </el-button>
                  <el-dropdown
                    v-if="item.status === AiPptStatusEnum.SUCCESS"
                    trigger="click"
                    :disabled="exportingId === item.id"
                    @command="(format: AiPptExportFormatEnum) => handleExport(item, format)"
                  >
                    <el-button link type="primary" size="small" :loading="exportingId === item.id">
                      导出 <Icon icon="ep:arrow-down" class="ml-2px" />
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="AiPptExportFormatEnum.PPTX">
                          导出 PPTX（16:9，每页一张图）
                        </el-dropdown-item>
                        <el-dropdown-item :command="AiPptExportFormatEnum.PDF">
                          导出 PDF（16:9，每页一张图）
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button
                    v-if="item.status !== AiPptStatusEnum.IN_PROGRESS"
                    link
                    type="danger"
                    size="small"
                    @click="handleDelete(item)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              <div
                v-if="item.status === AiPptStatusEnum.FAIL && item.errorMessage"
                class="rounded-4px bg-[var(--el-color-danger-light-9)] px-10px py-6px text-12px text-[var(--el-color-danger)] leading-18px"
              >
                {{ item.errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList()"
      />
    </ContentWrap>

    <!-- 预览、大纲 -->
    <PptPreviewDialog ref="previewRef" @refresh="getList(true)" />
    <PptOutlineDialog ref="outlineRef" />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import { PptApi, PptVO } from '@/api/ai/ppt'
import { AiPptExportFormatEnum, AiPptStatusEnum } from '@/views/ai/utils/constants'
import PptCreatePanel from './components/PptCreatePanel.vue'
import PptPreviewDialog from '../components/PptPreviewDialog.vue'
import PptOutlineDialog from '../components/PptOutlineDialog.vue'

/** AI PPT：用户创作页 */
defineOptions({ name: 'AiPpt' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const POLL_INTERVAL = 3000 // 有生成中任务时的刷新间隔

const loading = ref(false) // 列表的加载中
const list = ref<PptVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 })
/** 是否有生成中的任务：有则轮询刷新 */
const hasRunning = computed(() =>
  list.value.some((item) => item.status === AiPptStatusEnum.IN_PROGRESS)
)
let requestId = 0 // 请求序号：只采用最后一次请求的结果，避免轮询的旧响应覆盖翻页、提交后的刷新

/** 查询列表；silent 为 true 时不显示加载状态（轮询使用） */
const getList = async (silent = false) => {
  const currentRequestId = ++requestId
  if (silent !== true) {
    loading.value = true
  }
  try {
    const data = await PptApi.getPptMyPage(queryParams)
    if (currentRequestId !== requestId) {
      return
    }
    list.value = data.list
    total.value = data.total
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

/** 生成中的进度文案：分镜阶段没有页数；每页都有图时为单页重绘 */
const getProgressText = (item: PptVO) => {
  if (!item.slideCount) {
    return '正在生成分镜…'
  }
  if (item.finishCount < item.slideCount) {
    return `正在生成第 ${item.finishCount + 1} 页`
  }
  return '正在重绘…'
}

/** 提交成功：回到第一页 */
const handleSubmitted = () => {
  queryParams.pageNo = 1
  getList()
}

/** 预览 */
const previewRef = ref()
const openPreview = (item: PptVO) => {
  previewRef.value.open(item.id)
}

/** 查看大纲 */
const outlineRef = ref()
const openOutline = (item: PptVO) => {
  outlineRef.value.open(item.id)
}

/** 继续生成 */
const resumingId = ref<number>() // 继续生成中的 PPT 编号
const handleResume = async (item: PptVO) => {
  resumingId.value = item.id
  try {
    await PptApi.resumePptMy(item.id)
    message.success('已继续生成')
    await getList(true)
  } finally {
    resumingId.value = undefined
  }
}

/** 导出：文件名取标题 */
const exportingId = ref<number>() // 导出中的 PPT 编号
const handleExport = async (item: PptVO, format: AiPptExportFormatEnum) => {
  exportingId.value = item.id
  try {
    const data = await PptApi.exportPptMy(item.id, format)
    download[format](data, `${item.title}.${format}`)
  } finally {
    exportingId.value = undefined
  }
}

/** 删除 */
const handleDelete = async (item: PptVO) => {
  try {
    await message.delConfirm('确定删除该 PPT 吗？图片文件不随任务删除。')
  } catch {
    return
  }
  await PptApi.deletePptMy(item.id)
  message.success(t('common.delSuccess'))
  await getList()
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 静默轮询是否进行中：上一次未返回时不再发起
/** 开始轮询：有生成中的任务时，静默刷新列表 */
const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (!hasRunning.value || loading.value || polling) {
      return
    }
    polling = true
    try {
      await getList(true)
    } finally {
      polling = false
    }
  }, POLL_INTERVAL)
}

/** 停止轮询 */
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 初始化 */
onMounted(() => {
  getList()
  startPolling()
})
onActivated(startPolling)
onDeactivated(stopPolling)
onBeforeUnmount(stopPolling)
</script>
