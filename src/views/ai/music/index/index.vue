<!-- AI 音乐：用户创作页 -->
<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="min-h-0 flex flex-1 gap-16px">
      <!-- 左：创作面板 -->
      <div class="h-full w-360px flex-shrink-0">
        <MusicCreatePanel ref="createPanelRef" @submitted="handleSubmitted" />
      </div>

      <!-- 右：我的作品 / 音乐广场 -->
      <ContentWrap
        class="h-full min-w-0 flex-1"
        :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
      >
        <div class="flex items-center justify-between">
          <el-tabs v-model="activeTab" class="flex-1" @tab-change="handleTabChange">
            <el-tab-pane label="我的作品" name="my" />
            <el-tab-pane label="音乐广场" name="square" />
          </el-tabs>
          <div class="flex items-center gap-8px pb-14px">
            <el-input
              v-if="activeTab === 'square'"
              v-model="squareQuery.title"
              placeholder="搜索名称"
              clearable
              class="!w-200px"
              @keyup.enter="handleSquareSearch"
              @clear="handleSquareSearch"
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
          <MusicList
            v-if="activeTab === 'my'"
            :list="myList"
            :loading="myLoading"
            :current-id="playerState.id"
            :playing="playerState.playing"
            @play="handlePlay"
            @detail="openDetail"
            @extend="handleExtend"
            @concat="handleConcat"
            @edit="openEdit"
            @delete="handleDelete"
            @public="handlePublic"
          />
          <MusicList
            v-else
            square
            :list="squareList"
            :loading="squareLoading"
            :current-id="playerState.id"
            :playing="playerState.playing"
            @play="handlePlay"
            @detail="openDetail"
          />
        </div>
        <Pagination
          v-if="activeTab === 'my'"
          :total="myTotal"
          v-model:page="myQuery.pageNo"
          v-model:limit="myQuery.pageSize"
          @pagination="getMyList"
        />
        <Pagination
          v-else
          :total="squareTotal"
          v-model:page="squareQuery.pageNo"
          v-model:limit="squareQuery.pageSize"
          @pagination="getSquareList"
        />
      </ContentWrap>
    </div>

    <!-- 底：播放器 -->
    <MusicPlayer ref="playerRef" @change="(state) => (playerState = state)" />

    <!-- 详情、编辑 -->
    <MusicDetailDrawer ref="detailRef" @play="handlePlay" />
    <MusicEditDialog ref="editRef" @success="getMyList" />
  </div>
</template>

<script setup lang="ts">
import { MusicApi, MusicVO } from '@/api/ai/music'
import { isAiMusicRunning } from '@/views/ai/utils/constants'
import { getMusicTitle } from '@/views/ai/utils/utils'
import MusicCreatePanel from './components/MusicCreatePanel.vue'
import MusicList from './components/MusicList.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import MusicDetailDrawer from './components/MusicDetailDrawer.vue'
import MusicEditDialog from './components/MusicEditDialog.vue'

/** AI 音乐：用户创作页 */
defineOptions({ name: 'AiMusic' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute() // 路由

const POLL_INTERVAL = 5000 // 有未结束作品时的刷新间隔

const createPanelRef = ref()
const playerRef = ref()
const detailRef = ref()
const editRef = ref()
const playerState = ref<{ id?: number; playing: boolean }>({ playing: false }) // 播放器状态

const activeTab = ref<'my' | 'square'>('my')

// ========== 我的作品 ==========

const myLoading = ref(false)
const myList = ref<MusicVO[]>([])
const myTotal = ref(0)
const myQuery = reactive({ pageNo: 1, pageSize: 10 })
const hasRunning = computed(() => myList.value.some((item) => isAiMusicRunning(item.status)))
let myRequestId = 0 // 请求序号：只采用最后一次请求的结果，避免轮询的旧响应覆盖翻页、提交后的刷新

/** 查询我的作品；silent 为 true 时不显示加载状态（轮询使用） */
const getMyList = async (silent = false) => {
  const requestId = ++myRequestId
  if (silent !== true) {
    myLoading.value = true
  }
  try {
    const data = await MusicApi.getMusicMyPage(myQuery)
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

// ========== 音乐广场 ==========

const squareLoading = ref(false)
const squareList = ref<MusicVO[]>([])
const squareTotal = ref(0)
const squareQuery = reactive({ pageNo: 1, pageSize: 10, title: undefined as string | undefined })

let squareRequestId = 0 // 请求序号：只采用最后一次请求的结果

const getSquareList = async () => {
  const requestId = ++squareRequestId
  squareLoading.value = true
  try {
    const data = await MusicApi.getMusicPublicPage(squareQuery)
    if (requestId !== squareRequestId) {
      return
    }
    squareList.value = data.list
    squareTotal.value = data.total
  } finally {
    if (requestId === squareRequestId) {
      squareLoading.value = false
    }
  }
}

const handleSquareSearch = () => {
  squareQuery.pageNo = 1
  getSquareList()
}

const handleTabChange = () => {
  if (activeTab.value === 'my') {
    getMyList()
  } else {
    getSquareList()
  }
}

// ========== 作品操作 ==========

/** 播放：播放列表为当前列表中已完成的作品 */
const handlePlay = (item: MusicVO) => {
  const list = activeTab.value === 'my' ? myList.value : squareList.value
  playerRef.value?.play(item, list.filter((music) => music.status === item.status))
}

/** 详情 */
const openDetail = (item: MusicVO) => {
  detailRef.value?.open(item.id)
}

/** 续写：带入左侧面板 */
const handleExtend = (item: MusicVO) => {
  createPanelRef.value?.setExtendSource(item)
}

/** 合并为完整歌曲 */
const handleConcat = async (item: MusicVO) => {
  try {
    await message.confirm(
      `确认将续写作品《${getMusicTitle(item.title)}》与原曲合并为完整歌曲？` +
        '合并需中转支持 /suno/submit/concat 扩展路径（官方 SunoAPI 插件不支持）。'
    )
  } catch {
    return
  }
  await MusicApi.concatMusic(item.id)
  message.success('合并任务已提交')
  handleSubmitted()
}

/** 编辑名称与封面 */
const openEdit = (item: MusicVO) => {
  editRef.value?.open(item)
}

/** 删除 */
const handleDelete = async (item: MusicVO) => {
  try {
    const title = getMusicTitle(item.title)
    await message.delConfirm(`确认删除作品《${title}》？删除后不可恢复。`)
  } catch {
    return
  }
  await MusicApi.deleteMusicMy(item.id)
  message.success(t('common.delSuccess'))
  if (playerState.value.id === item.id) {
    playerRef.value?.close()
  }
  await getMyList()
}

/** 公开 / 取消公开 */
const handlePublic = async (item: MusicVO, value: boolean) => {
  await MusicApi.updateMyMusic({ id: item.id, publicStatus: value })
  item.publicStatus = value
  message.success(value ? '已公开到音乐广场' : '已取消公开')
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined
let polling = false // 静默轮询是否进行中：上一次未返回时不再发起，避免慢响应时轮询互相作废
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
