<!-- AI 绘图：右侧作品区（我的作品 / 公开画廊；与 AI PPT 右侧一致的分页，不搜索、不筛选） -->
<template>
  <ContentWrap
    class="!mb-0"
    :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
  >
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="我的作品" name="mine" />
      <el-tab-pane label="公开画廊" name="public" />
    </el-tabs>
    <div class="mb-12px flex items-center justify-between">
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        共 {{ total }} 条<template v-if="hasRunning"> · 有生成中任务时每 3 秒刷新</template>
      </span>
      <el-button link type="primary" :loading="loading" @click="getList()">
        <Icon icon="ep:refresh" class="mr-4px" /> 刷新
      </el-button>
    </div>
    <div v-loading="loading" class="min-h-0 flex-1 overflow-y-auto pr-4px">
      <el-empty
        v-if="list.length === 0"
        :description="activeTab === 'mine' ? '暂无作品，在左侧开始创作吧～' : '暂无公开作品'"
      />
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-12px">
        <ImageCard
          v-for="item in list"
          :key="item.id"
          :image="item"
          :scope="activeTab"
          @detail="handleDetail"
          @public="handlePublic"
          @regenerate="(image: ImageVO) => emit('regenerate', image)"
          @delete="handleDelete"
          @inpaint="(image: ImageVO) => maskDialogRef?.open(image)"
          @acted="refreshMine"
        />
      </div>
    </div>
    <!-- 分页：固定在作品区右下角，不随列表滚动 -->
    <div class="flex flex-shrink-0 justify-end">
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList()"
      />
    </div>

    <!-- 详情、局部重绘 -->
    <ImageDetail ref="detailRef" />
    <ImageMaskDialog ref="maskDialogRef" @success="refreshMine" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import { AiImageStatusEnum } from '@/views/ai/utils/constants'
import ImageCard from './ImageCard.vue'
import ImageDetail from './ImageDetail.vue'
import ImageMaskDialog from './ImageMaskDialog.vue'

defineOptions({ name: 'AiImageWorks' })

const emit = defineEmits(['regenerate'])

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute()

type WorksTab = 'mine' | 'public'

const POLL_INTERVAL = 3000 // 有生成中任务时的刷新间隔

const activeTab = ref<WorksTab>(route.query.works === 'public' ? 'public' : 'mine')
const loading = ref(false) // 列表的加载中
const list = ref<ImageVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 })
/** 是否有生成中的任务：只在我的作品轮询 */
const hasRunning = computed(
  () =>
    activeTab.value === 'mine' &&
    list.value.some((item) => item.status === AiImageStatusEnum.IN_PROGRESS)
)
let requestId = 0 // 请求序号：只采用最后一次请求的结果，避免轮询、切换页签的旧响应覆盖

/** 查询列表；silent 为 true 时不显示加载状态（轮询使用） */
const getList = async (silent = false) => {
  const currentRequestId = ++requestId
  const tab = activeTab.value
  if (silent !== true) {
    loading.value = true
  }
  try {
    const data =
      tab === 'mine'
        ? await ImageApi.getImagePageMy(queryParams)
        : await ImageApi.getImagePagePublic(queryParams)
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

/** 切换页签：回到第 1 页 */
const handleTabChange = () => {
  list.value = []
  queryParams.pageNo = 1
  getList()
}

/** 提交成功（创作、Midjourney 动作、局部重绘）：新记录在我的作品第 1 页，回到第 1 页 */
const refreshMine = () => {
  activeTab.value = 'mine'
  handleTabChange()
}

/** 详情 */
const detailRef = ref<InstanceType<typeof ImageDetail>>()
const handleDetail = (image: ImageVO) => {
  detailRef.value?.open(image.id, activeTab.value)
}

/** 公开、取消公开 */
const handlePublic = async (image: ImageVO) => {
  const publicStatus = !image.publicStatus
  try {
    await message.confirm(
      publicStatus
        ? '确认公开该作品？公开后同租户的用户可在公开画廊看到'
        : '确认取消公开？取消后公开画廊不再展示'
    )
  } catch {
    return
  }
  await ImageApi.updateImagePublicMy(image.id, publicStatus)
  message.success(publicStatus ? '已公开' : '已取消公开')
  await getList(true)
}

/** 删除 */
const handleDelete = async (image: ImageVO) => {
  try {
    await message.delConfirm('确定删除该作品吗？派生作品与图片文件不随之删除。')
  } catch {
    return
  }
  await ImageApi.deleteImageMy(image.id)
  message.success(t('common.delSuccess'))
  await getList()
}

/** 局部重绘 */
const maskDialogRef = ref<InstanceType<typeof ImageMaskDialog>>()

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 静默轮询是否进行中：上一次未返回时不再发起
/** 开始轮询：有生成中的任务时，静默刷新当前页（不重置页码） */
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

defineExpose({ refreshMine })

/** 初始化 */
onMounted(() => {
  getList()
  startPolling()
})
onActivated(startPolling)
onDeactivated(stopPolling)
onBeforeUnmount(stopPolling)
</script>
