<template>
  <div v-if="detail" class="flex h-full flex-col">
    <div
      class="shrink-0 border-b border-b-solid border-[var(--el-border-color-light)] px-16px py-12px"
    >
      <h2 class="m-0 break-words text-18px">{{ detail.subject || '（无主题）' }}</h2>
      <div class="mt-12px break-words text-13px leading-24px text-[var(--el-text-color-secondary)]">
        <div>发件人：{{ detail.sender }}</div>
        <div>收件人：{{ detail.recipients?.join(', ') }}</div>
        <div v-if="detail.ccs?.length">抄送人：{{ detail.ccs?.join(', ') }}</div>
        <div>时间：{{ formatDate(detail.receiveTime) }}</div>
      </div>
      <div class="mt-12px flex flex-wrap gap-8px [&>.el-button]:!ml-0">
        <el-button
          type="primary"
          :disabled="operating"
          @click="emit('compose', OA_MAIL_COMPOSE_MODE.REPLY)"
        >
          回复
        </el-button>
        <el-button :disabled="operating" @click="emit('compose', OA_MAIL_COMPOSE_MODE.REPLY_ALL)">
          回复全部
        </el-button>
        <el-button :disabled="operating" @click="emit('compose', OA_MAIL_COMPOSE_MODE.FORWARD)">
          转发
        </el-button>
        <el-button :loading="operating" @click="emit('read')">
          {{ detail.readStatus ? '标记未读' : '标记已读' }}
        </el-button>
        <el-button v-if="!showExternalImages" @click="showExternalImages = true">
          显示外部图片
        </el-button>
        <el-button
          v-if="folderKey === OA_MAIL_FOLDER_KEY.TRASH"
          :disabled="operating"
          @click="emit('restore')"
        >
          恢复到收件箱
        </el-button>
        <el-button type="danger" plain :disabled="operating" @click="emit('delete')">
          {{ folderKey === OA_MAIL_FOLDER_KEY.TRASH ? '彻底删除' : '删除' }}
        </el-button>
      </div>
      <div v-if="detail.attachments?.length" class="mt-12px text-13px">
        <span>附件：</span>
        <el-button
          v-for="attachment in detail.attachments"
          :key="attachment.part"
          link
          type="primary"
          :loading="downloadingPart === attachment.part"
          @click="downloadAttachment(attachment.part, attachment.name)"
        >
          {{ attachment.name }}
        </el-button>
      </div>
    </div>
    <!-- 正文沿用邮件自身排版，外层不叠加内边距 -->
    <iframe
      title="邮件正文"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      referrerpolicy="no-referrer"
      :srcdoc="mailHtml"
      class="min-h-0 w-full flex-1 border-0"
    >
    </iframe>
  </div>
  <el-empty v-else :description="detailError || '请选择邮件'" />
</template>

<script setup lang="ts">
import { downloadMailMessageAttachment } from '@/api/oa/mail/message'
import { downloadByData } from '@/utils/filt'
import type { MailMessageVO } from '@/api/oa/mail/message'
import { formatDate } from '@/utils/formatTime'
import { OA_MAIL_FOLDER_KEY, OA_MAIL_COMPOSE_MODE } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaMailMessageDetail' })

const props = defineProps<{
  detail?: MailMessageVO
  detailError: string
  folderKey: string
  operating: boolean
}>()
const emit = defineEmits<{
  compose: [mode: string]
  read: []
  delete: []
  restore: []
}>()

const downloadingPart = ref<string>() // 正在下载的附件
const showExternalImages = ref(false) // 用户选择后加载邮件外部图片

watch(
  () => props.detail?.id,
  () => {
    showExternalImages.value = false
  }
)

/** 下载本人邮件附件 */
async function downloadAttachment(part: string, name: string) {
  if (!props.detail?.id) return
  downloadingPart.value = part
  try {
    downloadByData(await downloadMailMessageAttachment(props.detail.id, part), name)
  } finally {
    downloadingPart.value = undefined
  }
}

// 邮件正文使用独立沙箱，链接在新窗口打开，外部图片由用户选择加载
const mailHtml = computed(
  () =>
    `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data: ${showExternalImages.value ? 'http: https:' : ''}; base-uri &#39;none&#39;; form-action &#39;none&#39;"><base target="_blank"><style>body{font:14px/1.7 sans-serif;padding:20px;overflow-wrap:anywhere}table,img{max-width:100%}pre{white-space:pre-wrap}</style></head><body>` +
    (props.detail?.content || '') +
    '</body></html>'
)
</script>
