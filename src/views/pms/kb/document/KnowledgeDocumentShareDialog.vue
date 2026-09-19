<template>
  <Dialog v-model="dialogVisible" title="分享文档" width="600px">
    <el-form label-width="100px">
      <el-form-item label="公开链接">
        <div v-if="share" class="flex w-full gap-8px">
          <el-input :model-value="shareUrl" readonly />
          <el-button @click="copyShareUrl">复制链接</el-button>
        </div>
        <el-text v-else type="info">开启后，任何获得链接的人都可以查看当前文档。</el-text>
      </el-form-item>
      <el-form-item v-if="share" label="二维码">
        <div class="flex items-center gap-12px">
          <Qrcode
            :text="shareUrl"
            :width="160"
            :options="qrCodeOptions"
            class="h-160px w-160px border border-[var(--el-border-color)] rounded-4px"
            @done="handleQrCodeDone"
          />
          <el-button :disabled="!qrCodeDataUrl" @click="downloadQrCode">下载二维码</el-button>
        </div>
      </el-form-item>
      <el-form-item label="分享给成员">
        <UserSelectV2 v-model="shareUserIds" :multiple="true" placeholder="请选择内部分享成员" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-popconfirm
        v-if="share"
        cancel-button-text="取消"
        confirm-button-text="确定"
        title="关闭后，现有公开链接将立即失效。是否继续？"
        width="280"
        @confirm="closeShare"
      >
        <template #reference>
          <el-button :disabled="formLoading" type="danger">关闭分享</el-button>
        </template>
      </el-popconfirm>
      <el-button :disabled="formLoading" type="primary" @click="submitShare">
        {{ share ? '保存成员' : '开启分享' }}
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentShareApi from '@/api/pms/kb/interaction/share'
import { Qrcode } from '@/components/Qrcode'
import download from '@/utils/download'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'PmsKnowledgeDocumentShareDialog' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单提交中
const documentId = ref<number>() // 文档编号
const share = ref<KnowledgeDocumentShareApi.PmsKnowledgeDocumentShareVO>() // 文档分享信息
const shareUserIds = ref<number[]>([]) // 分享成员用户编号
const qrCodeDataUrl = ref('') // 分享二维码图片数据
const qrCodeOptions = {
  margin: 1,
  color: { dark: '#1f2937', light: '#ffffff' }
}

const shareUrl = computed(() => {
  if (!share.value) return ''
  return `${window.location.origin}/pms/kb/document/share/${share.value.token}`
}) // 文档分享地址

/** 打开弹窗 */
async function open(id: number) {
  dialogVisible.value = true
  documentId.value = id
  qrCodeDataUrl.value = ''
  formLoading.value = true
  try {
    share.value = await KnowledgeDocumentShareApi.getKnowledgeDocumentShare(id)
    shareUserIds.value = share.value?.shareUserIds || []
  } finally {
    formLoading.value = false
  }
}

/** 创建文档分享 */
async function submitShare() {
  if (!documentId.value) return
  formLoading.value = true
  try {
    if (share.value) {
      await KnowledgeDocumentShareApi.updateKnowledgeDocumentShareMemberList({
        documentId: documentId.value,
        shareUserIds: shareUserIds.value
      })
      message.success('分享成员已更新')
      dialogVisible.value = false
    } else {
      share.value = await KnowledgeDocumentShareApi.openKnowledgeDocumentShare({
        documentId: documentId.value,
        shareUserIds: shareUserIds.value
      })
      message.success('分享已开启')
    }
  } finally {
    formLoading.value = false
  }
}

/** 关闭文档分享 */
async function closeShare() {
  if (!documentId.value) return
  formLoading.value = true
  try {
    await KnowledgeDocumentShareApi.closeKnowledgeDocumentShare(documentId.value)
    share.value = undefined
    shareUserIds.value = []
    qrCodeDataUrl.value = ''
    message.success('分享已关闭')
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 记录公共二维码组件生成的图片数据，供下载使用 */
function handleQrCodeDone(dataUrl: string) {
  qrCodeDataUrl.value = dataUrl
}

/** 下载公开分享二维码 */
function downloadQrCode() {
  if (!qrCodeDataUrl.value) return
  download.base64Image(qrCodeDataUrl.value, 'knowledge-document-share')
}

/** 复制分享链接 */
async function copyShareUrl() {
  await navigator.clipboard.writeText(shareUrl.value)
  message.success('链接已复制')
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
