<template>
  <Dialog v-model="dialogVisible" title="选择推送方式" width="560">
    <div class="mb-12px text-13px text-[var(--el-text-color-secondary)]">
      推送方式只影响本次通知的接收通道，客户端需要已建立对应协议的连接。
    </div>
    <el-radio-group v-model="pushMode" class="w-full !block">
      <el-card
        v-for="item in PUSH_MODES"
        :key="item.value"
        shadow="never"
        class="mb-12px cursor-pointer"
        :class="{ '!border-[var(--el-color-primary)]': pushMode === item.value }"
        @click="pushMode = item.value"
      >
        <div class="flex items-start justify-between gap-12px">
          <el-radio :value="item.value" class="!h-auto !items-start">
            <div class="font-medium">{{ item.label }}</div>
            <div class="mt-4px whitespace-normal text-12px text-[var(--el-text-color-secondary)]">
              {{ item.description }}
            </div>
          </el-radio>
          <el-link
            type="primary"
            :href="item.docUrl"
            target="_blank"
            class="shrink-0 !text-12px"
            @click.stop
          >
            {{ item.docText }}
          </el-link>
        </div>
      </el-card>
    </el-radio-group>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确认推送</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as NoticeApi from '@/api/system/notice'
import * as SseApi from '@/api/infra/sse'

defineOptions({ name: 'SystemNoticePushForm' })

type PushMode = 'WEBSOCKET' | 'SSE'

/** 推送方式：每种协议各自的使用文档 */
const PUSH_MODES: {
  value: PushMode
  label: string
  description: string
  docText: string
  docUrl: string
}[] = [
  {
    value: 'WEBSOCKET',
    label: 'WebSocket 推送',
    description: '全双工长连接，适合双向通信和在线交互，使用 ping/pong 保持连接。',
    docText: 'WebSocket 文档',
    docUrl: 'https://doc.iocoder.cn/websocket/'
  },
  {
    value: 'SSE',
    label: 'SSE 推送',
    description: '基于 HTTP 的服务端单向推送，适合通知类消息，EventSource 按 retry 自动重连。',
    docText: 'SSE 文档',
    docUrl: 'https://doc.iocoder.cn/sse/' // SSE 文档待发布，发布后确认路径
  }
]
const PUSH_MODE_KEY = 'yudao.push.mode' // 上次选择的推送方式

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 推送中
const noticeId = ref<number>() // 待推送的公告编号
const pushMode = ref<PushMode>('WEBSOCKET') // 推送方式

/** 打开弹窗 */
const open = async (id: number) => {
  noticeId.value = id
  // 默认选中上次的推送方式；该方式未开启、另一种已开启时，改为选中另一种
  const lastMode = localStorage.getItem(PUSH_MODE_KEY) === 'SSE' ? 'SSE' : 'WEBSOCKET'
  const config = await SseApi.getSseConfig()
  const enabled = { WEBSOCKET: config?.websocketEnabled, SSE: config?.sseEnabled }
  const otherMode = lastMode === 'SSE' ? 'WEBSOCKET' : 'SSE'
  pushMode.value = !enabled[lastMode] && enabled[otherMode] ? otherMode : lastMode
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 确认推送 */
const submitForm = async () => {
  formLoading.value = true
  try {
    await NoticeApi.pushNotice(noticeId.value!, pushMode.value)
    localStorage.setItem(PUSH_MODE_KEY, pushMode.value)
    dialogVisible.value = false
    message.success('推送成功')
  } finally {
    formLoading.value = false
  }
}
</script>
