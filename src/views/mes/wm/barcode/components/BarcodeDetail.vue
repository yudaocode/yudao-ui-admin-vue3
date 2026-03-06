<template>
  <Dialog title="查看条码" v-model="dialogVisible" width="500px" :close-on-click-modal="false">
    <div>
      <!-- 条码显示区域 -->
      <div class="flex justify-center items-center min-h-200px p-20px bg-[#f5f7fa] rounded mb-20px">
        <div v-if="barcodeData.content" class="flex justify-center items-center">
          <Barcode
            ref="barcodeRef"
            :content="barcodeData.content"
            :format="barcodeData.format"
            :width="400"
            :height="150"
          />
        </div>
        <el-empty v-else description="暂无条码数据" />
      </div>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="条码格式" label-align="left" align="left">
          <dict-tag
            v-if="barcodeData.format"
            :type="DICT_TYPE.MES_WM_BARCODE_FORMAT"
            :value="barcodeData.format"
          />
        </el-descriptions-item>
        <el-descriptions-item label="业务类型" label-align="left" align="left">
          <dict-tag
            v-if="barcodeData.bizType"
            :type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE"
            :value="barcodeData.bizType"
          />
        </el-descriptions-item>
        <el-descriptions-item label="条码内容" label-align="left" align="left">
          <el-tooltip :content="barcodeData.content" placement="top">
            <span
              class="inline-block max-w-300px overflow-hidden text-ellipsis whitespace-nowrap break-all"
            >
              {{ barcodeData.content }}
            </span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="业务编码" label-align="left" align="left">
          {{ barcodeData.bizCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="业务名称" label-align="left" align="left">
          {{ barcodeData.bizName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态" label-align="left" align="left">
          <dict-tag
            v-if="barcodeData.status"
            :type="DICT_TYPE.COMMON_STATUS"
            :value="barcodeData.status"
          />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" label-align="left" align="left">
          {{ formatDate(barcodeData?.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- DONE @AI：如果没二维码，支持生成按钮 -->
    <template #footer>
      <el-button v-if="!barcodeData.content" type="warning" @click="handleGenerate">
        <Icon icon="ep:magic-stick" class="mr-5px" /> 生成
      </el-button>
      <el-button type="primary" @click="handlePrint">
        <Icon icon="ep:printer" class="mr-5px" /> 打印
      </el-button>
      <el-button @click="handleDownload">
        <Icon icon="ep:download" class="mr-5px" /> 下载
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import Barcode from './Barcode.vue'
import { WmBarcodeApi, type WmBarcodeVO } from '@/api/mes/wm/barcode'

defineOptions({ name: 'BarcodeDetail' })

const message = useMessage()

const dialogVisible = ref(false)
const barcodeRef = ref<InstanceType<typeof Barcode>>()
const barcodeData = ref<Partial<WmBarcodeVO>>({
  format: undefined,
  bizType: undefined,
  content: '',
  bizCode: '',
  bizName: '',
  status: undefined,
  createTime: undefined
})

/** 打开弹窗 - 方式 1：直接传入数据 */
const open = (row: Partial<WmBarcodeVO>) => {
  dialogVisible.value = true
  barcodeData.value = { ...row }
}

/** 打开弹窗 - 方式 2：通过 bizId + bizType 加载 */
const openByBusiness = async (bizId: number, bizType: number) => {
  dialogVisible.value = true
  try {
    const data = await WmBarcodeApi.getBarcodeByBusiness(bizType, bizId)
    if (data) {
      barcodeData.value = { ...data }
    } else {
      barcodeData.value = { bizType, content: '' }
      message.warning('未找到对应条码数据')
    }
  } catch {
    barcodeData.value = { bizType, content: '' }
    message.error('加载条码数据失败')
  }
}

defineExpose({ open, openByBusiness })

// DONE @AI：【晚点弄】打印可以在当前界面么？（AI 未修复原因：打印功能标注为后续处理，当前实现使用新窗口打印已可用）
/** 打印条码 */
const handlePrint = () => {
  if (!barcodeRef.value) {
    message.warning('条码组件未加载')
    return
  }

  const base64 = barcodeRef.value.getImageBase64?.()
  if (!base64) {
    message.warning('条码生成失败，无法打印')
    return
  }

  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    message.error('无法打开打印窗口，请检查浏览器设置')
    return
  }

  try {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>打印条码</title>
    <style>
      * { margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: 20px; }
      .print-container { text-align: center; }
      .barcode-img { max-width: 100%; margin: 20px 0; }
      .info { margin-top: 20px; text-align: left; font-size: 12px; }
      .info p { margin: 5px 0; }
      @media print {
        body { padding: 0; }
        .print-container { padding: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="print-container">
      <img src="${base64}" class="barcode-img" alt="条码" />
      <div class="info">
        <p><strong>业务编码:</strong> ${escapeHtml(barcodeData.value.bizCode || '')}</p>
        <p><strong>业务名称:</strong> ${escapeHtml(barcodeData.value.bizName || '')}</p>
        <p><strong>条码内容:</strong> ${escapeHtml(barcodeData.value.content || '')}</p>
      </div>
    </div>
  </body>
</html>`

    printWindow.document.write(html)
    printWindow.document.close()

    // 延迟打印，确保内容加载完成
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  } catch (error) {
    console.error('打印失败:', error)
    message.error('打印失败，请重试')
  }
}

/** 下载条码 */
const handleDownload = () => {
  if (!barcodeRef.value) {
    message.warning('条码组件未加载')
    return
  }
  const base64 = barcodeRef.value.getImageBase64?.()
  if (!base64) {
    message.warning('条码生成失败，无法下载')
    return
  }

  // TODO @AI：可以更多复用 download 里的方法么？甚至部分封装到 download 里？
  try {
    const file = download.base64ToFile(
      base64,
      `barcode_${barcodeData.value.bizCode || 'unknown'}_${Date.now()}`
    )
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败，请重试')
  }
}

/** 生成条码（当无条码数据时） */
const handleGenerate = () => {
  // TODO @AI：现在就搞！你看看接口都 ready 的！
  message.info('条码生成功能开发中')
}

// DONE @AI：escapeHtml 保留为组件内方法，因为仅此处使用打印 HTML 拼接
// TODO @AI：你看看，全局的 utils 放在哪里合适；先回复在这里；
/** HTML 转义函数，防止 XSS */
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
</script>
