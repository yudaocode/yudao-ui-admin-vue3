<!-- AI 语音：用户合成页 -->
<template>
  <!-- 高度占满可视区域（与 AI 图片生成、OCR 文字识别一致）：左侧表单内部滚动，「生成语音」按钮固定在底部 -->
  <div
    class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding))] flex flex-col overflow-hidden"
  >
    <doc-alert title="AI 语音生成" url="https://doc.iocoder.cn/ai/speech/" />
    <div class="min-h-0 flex flex-1 gap-16px">
      <!-- 左：合成面板 -->
      <div class="h-full w-380px flex-shrink-0">
        <SpeechCreatePanel
          ref="createPanelRef"
          :models="models"
          :model-loading="modelLoading"
          @submitted="handleSubmitted"
        />
      </div>

      <!-- 右：我的语音 -->
      <ContentWrap
        class="h-full min-w-0 flex-1"
        :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
      >
        <div class="mb-12px flex items-center justify-between">
          <span class="text-16px font-bold">我的语音</span>
          <div class="flex items-center gap-8px">
            <span v-if="hasRunning" class="text-12px text-[var(--el-text-color-secondary)]">
              自动刷新中
            </span>
            <el-button link type="primary" :loading="loading" @click="getList()">
              <Icon icon="ep:refresh" class="mr-2px" /> 刷新
            </el-button>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto pr-4px">
          <SpeechList
            :list="list"
            :loading="loading"
            :current-id="playerState.id"
            :playing="playerState.playing"
            @play="handlePlay"
            @detail="openDetail"
            @again="handleAgain"
            @delete="handleDelete"
          />
        </div>
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList()"
        />
      </ContentWrap>
    </div>

    <!-- 底：播放器 -->
    <SpeechPlayer ref="playerRef" @change="(state) => (playerState = state)" />

    <!-- 详情 -->
    <SpeechDetailDrawer ref="detailRef" @play="handlePlay" @again="handleAgain" />
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { SpeechApi, SpeechVO } from '@/api/ai/speech'
import { ModelApi } from '@/api/ai/model/model'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'
import { buildSpeechModels, isSpeechRunning, SpeechModel } from '@/views/ai/utils/speech'
import SpeechCreatePanel from './components/SpeechCreatePanel.vue'
import SpeechList from './components/SpeechList.vue'
import SpeechPlayer from './components/SpeechPlayer.vue'
import SpeechDetailDrawer from './components/SpeechDetailDrawer.vue'

/** AI 语音：用户合成页 */
defineOptions({ name: 'AiSpeech' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const POLL_INTERVAL = 3000 // 有生成中的语音时的刷新间隔

const createPanelRef = ref()
const playerRef = ref()
const detailRef = ref()
const playerState = ref<{ id?: number; playing: boolean }>({ playing: false }) // 播放器状态

// ========== 模型 ==========

const modelLoading = ref(true)
const models = ref<SpeechModel[]>([]) // 已启用的语音模型：只保留支持语音合成的平台

const getModels = async () => {
  modelLoading.value = true
  try {
    models.value = buildSpeechModels(await ModelApi.getModelSimpleList(AiModelTypeEnum.VOICE))
  } finally {
    modelLoading.value = false
  }
}

// ========== 我的语音 ==========

const loading = ref(false) // 列表的加载中
const list = ref<SpeechVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})
const hasRunning = computed(() => list.value.some((item) => isSpeechRunning(item))) // 是否有生成中的语音

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SpeechApi.getSpeechMyPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 提交成功：回到第一页 */
const handleSubmitted = () => {
  queryParams.pageNo = 1
  getList()
}

// ========== 操作 ==========

const handlePlay = (item: SpeechVO) => {
  playerRef.value?.play(item)
}

const openDetail = (item: SpeechVO) => {
  detailRef.value?.open(item.id)
}

/** 再次生成：带入左侧面板 */
const handleAgain = (item: SpeechVO) => {
  createPanelRef.value?.fill(item)
}

/** 删除：当前页删空时，由分页组件回到上一页 */
const handleDelete = async (item: SpeechVO) => {
  try {
    await message.delConfirm('确认删除该语音？删除后不可恢复。')
  } catch {
    return
  }
  await SpeechApi.deleteSpeechMy(item.id)
  message.success(t('common.delSuccess'))
  if (playerState.value.id === item.id) {
    playerRef.value?.close()
  }
  detailRef.value?.closeIf(item.id)
  await getList()
}

// ========== 轮询：逐条查询生成中的语音，后端会同步一次结果 ==========

let polling = false // 上一轮未结束时不再发起，避免慢响应时请求堆积

const poll = async () => {
  if (polling || loading.value || !hasRunning.value) {
    return
  }
  polling = true
  try {
    for (const running of list.value.filter((item) => isSpeechRunning(item))) {
      const speech = await SpeechApi.getSpeechMy(running.id).catch(() => undefined)
      // 已翻页、刷新的，列表中找不到，不再更新
      const index = list.value.findIndex((item) => item.id === running.id)
      if (speech && index >= 0) {
        list.value[index] = speech
        detailRef.value?.update(speech)
      }
    }
  } finally {
    polling = false
  }
}

// 只有一个定时器：resume 时先清除旧的；组件卸载时自动停止
const { pause: stopPolling, resume: startPolling } = useIntervalFn(poll, POLL_INTERVAL, {
  immediate: false
})

/** 初始化 */
onMounted(() => {
  getModels()
  getList()
  startPolling()
})
onActivated(startPolling)
onDeactivated(stopPolling)
</script>
