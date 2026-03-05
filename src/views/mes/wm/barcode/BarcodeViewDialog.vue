<template>
  <!--
   TODO @AI：挪到 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/barcode/components 里，改名为 BarcodeDetail；
   TODO @AI：参数有 2 种：1）一种是目前这种 BarcodeData；2）在加一种是 bizId + bizType 组合，然后去加载 BarcodeData
   // TODO @AI：BarcodeData 去掉，直接使用 BarcodeVO 就好了；
   -->
  <Dialog title="查看条码" v-model="dialogVisible" width="500px" :close-on-click-modal="false">
    <div class="barcode-view-container">
      <!-- 条码显示区域 -->
      <div class="barcode-display">
        <div v-if="barcodeData.content" class="barcode-wrapper">
          <!-- TODO @AI：二维码不够大 -->
          <Barcode
            ref="barcodeRef"
            :content="barcodeData.content"
            :format="barcodeData.format"
            :width="300"
            :height="150"
          />
        </div>
        <el-empty v-else description="暂无条码数据" />
      </div>

      <!-- 条码详细信息 -->
      <!-- TODO @AI：统一左对齐；目前貌似没左对齐； -->
      <el-descriptions :column="1" border class="barcode-info">
        <el-descriptions-item label="条码格式" label-align="center" align="left">
          <!-- TODO @AI：不用 String -->
          <dict-tag :type="DICT_TYPE.MES_BARCODE_FORMAT" :value="String(barcodeData.format)" />
        </el-descriptions-item>
        <el-descriptions-item label="业务类型" label-align="center" align="left">
          <!-- TODO @AI：不用 String -->
          <dict-tag :type="DICT_TYPE.MES_BARCODE_BIZ_TYPE" :value="String(barcodeData.bizType)" />
        </el-descriptions-item>
        <el-descriptions-item label="条码内容" label-align="center" align="left">
          <el-tooltip :content="barcodeData.content" placement="top">
            <span class="content-text">{{ barcodeData.content }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="业务编码" label-align="center" align="left">
          {{ barcodeData.bizCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="业务名称" label-align="center" align="left">
          {{ barcodeData.bizName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态" label-align="center" align="left">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="String(barcodeData.status)" />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" label-align="center" align="left">
          {{ formatDate(barcodeData.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 底部操作按钮 -->
    <!-- TODO @AI：如果没二维码的情况，需要支持【生成】 -->
    <template #footer>
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
import { Barcode } from './components'

defineOptions({ name: 'BarcodeViewDialog' })

interface BarcodeData {
  id?: number
  format?: number
  bizType?: number
  content: string
  bizCode?: string
  bizName?: string
  status?: number
  createTime?: string
}

const message = useMessage()

const dialogVisible = ref(false)
const barcodeRef = ref<InstanceType<typeof Barcode>>()
const barcodeData = ref<BarcodeData>({
  format: undefined,
  bizType: undefined,
  content: '',
  bizCode: '',
  bizName: '',
  status: undefined,
  createTime: ''
})

/** 打开弹窗 */
const open = (row: BarcodeData) => {
  dialogVisible.value = true
  barcodeData.value = { ...row }
}
defineExpose({ open })

/** 打印条码 */
// TODO @AI：【晚点弄】打印可以在当前界面么？你先回复我；
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
// TODO @AI：下载有工具类的，看看复用下；download；
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

  try {
    // 将 base64 转换为 Blob
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    const n = bstr.length
    const u8arr = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i)
    }
    const blob = new Blob([u8arr], { type: mime })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `barcode_${barcodeData.value.bizCode || 'unknown'}_${Date.now()}.png`
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

/** HTML 转义函数，防止 XSS */
// TODO @AI：是不是搞成一个公共方法；
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
// TODO @AI：下面的 css，尽量用 unocss；
</script>

<style scoped lang="scss">
.barcode-view-container {
  .barcode-display {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 20px;

    .barcode-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .barcode-info {
    margin-top: 0;

    :deep(.el-descriptions__body) {
      background-color: #fff;
    }

    :deep(.el-descriptions-item__label) {
      font-weight: 500;
      color: #606266;
      background-color: #f5f7fa;
    }

    :deep(.el-descriptions-item__content) {
      color: #303133;
    }
  }

  .content-text {
    display: inline-block;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
  }
}
</style>
