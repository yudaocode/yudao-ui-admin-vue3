<!-- AI 视频：用户创作页 -->
<template>
  <!-- 高度占满可视区域（与 AI 图片一致）：左侧表单、右侧作品各自滚动，生成按钮与分页始终可见 -->
  <div
    class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding))] flex gap-16px overflow-hidden"
  >
    <!-- 左：创作面板 -->
    <div class="h-full w-380px flex-shrink-0">
      <VideoCreatePanel ref="createPanelRef" @submitted="handleSubmitted" />
    </div>

    <!-- 右：我的作品 / 公开作品 -->
    <ContentWrap
      class="h-full min-w-0 flex-1 !mb-0"
      :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
    >
      <div class="flex items-center justify-between">
        <el-tabs v-model="activeTab" class="flex-1" @tab-change="handleTabChange">
          <el-tab-pane label="我的作品" name="my" />
          <el-tab-pane label="公开作品" name="public" />
        </el-tabs>
        <div class="flex items-center gap-8px pb-14px">
          <el-select
            v-model="currentQuery.type"
            placeholder="全部类型"
            clearable
            class="!w-130px"
            @change="handleSearch"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.AI_VIDEO_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
          <el-input
            v-if="activeTab === 'public'"
            v-model="publicQuery.prompt"
            placeholder="搜索提示词"
            clearable
            class="!w-200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><Icon icon="ep:search" /></template>
          </el-input>
          <span
            v-if="activeTab === 'my' && hasRunning"
            class="text-12px text-[var(--el-text-color-secondary)]"
          >
            自动刷新中
          </span>
        </div>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto pr-4px">
        <VideoList
          v-if="activeTab === 'my'"
          :list="myList"
          :loading="myLoading"
          @detail="openDetail"
          @same="handleSame"
          @delete="handleDelete"
        />
        <VideoList
          v-else
          square
          :list="publicList"
          :loading="publicLoading"
          @detail="openDetail"
          @same="handleSame"
        />
      </div>
      <!-- 分页：固定在作品区右下角，不随列表滚动 -->
      <div class="flex flex-shrink-0 justify-end">
        <Pagination
          v-if="activeTab === 'my'"
          :total="myTotal"
          v-model:page="myQuery.pageNo"
          v-model:limit="myQuery.pageSize"
          @pagination="getMyList"
        />
        <Pagination
          v-else
          :total="publicTotal"
          v-model:page="publicQuery.pageNo"
          v-model:limit="publicQuery.pageSize"
          @pagination="getPublicList"
        />
      </div>
    </ContentWrap>

    <!-- 详情 -->
    <VideoDetailDialog ref="detailRef" @same="handleSame" />
  </div>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { VideoApi, VideoVO } from '@/api/ai/video'
import { isAiVideoRunning } from '@/views/ai/utils/constants'
import VideoCreatePanel from './components/VideoCreatePanel.vue'
import VideoList from './components/VideoList.vue'
import VideoDetailDialog from '../components/VideoDetailDialog.vue'

/** AI 视频：用户创作页 */
defineOptions({ name: 'AiVideo' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute() // 路由

const POLL_INTERVAL = 5000 // 有未结束作品时的刷新间隔

const createPanelRef = ref()
const detailRef = ref()
const activeTab = ref<'my' | 'public'>('my')

// ========== 我的作品 ==========

const myLoading = ref(false)
const myList = ref<VideoVO[]>([])
const myTotal = ref(0)
const myQuery = reactive({ pageNo: 1, pageSize: 10, type: undefined as number | undefined })
const hasRunning = computed(() => myList.value.some((item) => isAiVideoRunning(item.status)))
let myRequestId = 0 // 请求序号：只采用最后一次请求的结果，避免轮询的旧响应覆盖翻页、提交后的刷新

/** 查询我的作品；silent 为 true 时不显示加载状态（轮询使用） */
const getMyList = async (silent = false) => {
  const requestId = ++myRequestId
  if (silent !== true) {
    myLoading.value = true
  }
  try {
    const data = await VideoApi.getVideoMyPage(myQuery)
    if (requestId !== myRequestId) {
      return
    }
    myList.value = data.list
    myTotal.value = data.total
  } finally {
    if (requestId === myRequestId) {
      myLoading.value = false
    }
  }
}

/** 提交成功：回到我的作品第一页 */
const handleSubmitted = () => {
  activeTab.value = 'my'
  myQuery.pageNo = 1
  getMyList()
}

// ========== 公开作品 ==========

const publicLoading = ref(false)
const publicList = ref<VideoVO[]>([])
const publicTotal = ref(0)
const publicQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined as number | undefined,
  prompt: undefined as string | undefined
})
let publicRequestId = 0 // 请求序号：只采用最后一次请求的结果

const getPublicList = async () => {
  const requestId = ++publicRequestId
  publicLoading.value = true
  try {
    const data = await VideoApi.getVideoPublicPage(publicQuery)
    if (requestId !== publicRequestId) {
      return
    }
    publicList.value = data.list
    publicTotal.value = data.total
  } finally {
    if (requestId === publicRequestId) {
      publicLoading.value = false
    }
  }
}

/** 当前页签的查询条件 */
const currentQuery = computed(() => (activeTab.value === 'my' ? myQuery : publicQuery))

const handleSearch = () => {
  currentQuery.value.pageNo = 1
  handleTabChange()
}

const handleTabChange = () => {
  if (activeTab.value === 'my') {
    getMyList()
  } else {
    getPublicList()
  }
}

// ========== 作品操作 ==========

const openDetail = (item: VideoVO) => {
  detailRef.value?.open(item.id)
}

/** 做同款：带回左侧表单 */
const handleSame = (item: VideoVO) => {
  createPanelRef.value?.applySame(item)
  message.success('已带入类型、模型与参数，请上传素材后生成')
}

const handleDelete = async (item: VideoVO) => {
  try {
    await message.delConfirm('确认删除该作品？删除后不可恢复。')
  } catch {
    return
  }
  await VideoApi.deleteVideoMy(item.id)
  message.success(t('common.delSuccess'))
  await getMyList()
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined
let polling = false // 静默轮询是否进行中：上一次未返回时不再发起
const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (activeTab.value !== 'my' || !hasRunning.value || myLoading.value || polling) {
      return
    }
    polling = true
    try {
      await getMyList(true)
    } finally {
      polling = false
    }
  }, POLL_INTERVAL)
}
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 初始化：加载我的作品；?id= 深链打开详情 */
onMounted(() => {
  getMyList()
  startPolling()
  const id = Number(route.query.id)
  if (id) {
    detailRef.value?.open(id)
  }
})
onActivated(startPolling)
onDeactivated(stopPolling)
onBeforeUnmount(stopPolling)
</script>
