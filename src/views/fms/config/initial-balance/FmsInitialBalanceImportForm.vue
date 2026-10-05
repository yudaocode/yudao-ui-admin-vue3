<template>
  <Dialog v-model="dialogVisible" title="导入初始余额" width="680px">
    <template v-if="result === undefined">
      <div class="import-section">
        <div class="section-title">一、请下载当前账套的初始余额模板</div>
        <el-button link type="primary" :loading="templateLoading" @click="downloadTemplate">
          <Icon icon="ep:download" /> 下载《财务初始余额导入模板》
        </el-button>
        <div class="import-tip"> 模板已带出末级科目；辅助核算项目按“类别:名称/类别:名称”填写 </div>
      </div>
      <div class="import-section">
        <div class="section-title">二、填写完成后上传模板</div>
        <el-upload
          ref="uploadRef"
          v-model:file-list="fileList"
          :auto-upload="false"
          :limit="1"
          :on-exceed="handleExceed"
          accept=".xlsx,.xls"
          action="none"
          drag
        >
          <Icon class="upload-icon" icon="ep:upload-filled" />
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 xls、xlsx 格式</div>
          </template>
        </el-upload>
      </div>
    </template>

    <el-result
      v-else
      icon="success"
      title="初始余额导入成功"
      :sub-title="`已更新 ${result} 个末级科目`"
    />

    <template #footer>
      <template v-if="result === undefined">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button
          :disabled="!fileList.length"
          :loading="formLoading"
          type="primary"
          @click="submitImport"
        >
          开始导入
        </el-button>
      </template>
      <template v-else>
        <el-button @click="resetImport">继续导入</el-button>
        <el-button type="primary" @click="dialogVisible = false">完 成</el-button>
      </template>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { UploadUserFile } from 'element-plus'

import { FmsInitialBalanceApi } from '@/api/fms/config/initial-balance'
import download from '@/utils/download'

defineOptions({ name: 'FmsInitialBalanceImportForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const templateLoading = ref(false) // 模板的下载中
const accountSetId = ref(0) // 账套编号
const fileList = ref<UploadUserFile[]>([]) // 文件列表
const result = ref<number>() // 导入数量
const uploadRef = ref() // 上传 Ref

/** 打开弹窗 */
function open(id: number) {
  accountSetId.value = id
  dialogVisible.value = true
  resetImport()
}
defineExpose({ open })

/** 下载导入模板 */
async function downloadTemplate() {
  templateLoading.value = true
  try {
    download.excel(
      await FmsInitialBalanceApi.getInitialBalanceImportTemplate(accountSetId.value),
      '财务初始余额导入模板.xlsx'
    )
  } finally {
    templateLoading.value = false
  }
}

const emits = defineEmits(['success']) // 定义 success 事件

/** 提交导入 */
async function submitImport() {
  const rawFile = fileList.value[0]?.raw
  if (!rawFile) {
    message.warning('请选择需要导入的文件')
    return
  }
  formLoading.value = true
  try {
    result.value = await FmsInitialBalanceApi.importInitialBalance(accountSetId.value, rawFile)
    emits('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置导入 */
function resetImport() {
  fileList.value = []
  result.value = undefined
  nextTick(() => uploadRef.value?.clearFiles())
}

/** 文件数超出提示 */
function handleExceed() {
  message.warning('每次只能上传一个文件')
}
</script>

<style scoped>
.import-section {
  padding: 0 28px;
}

.import-section + .import-section {
  margin-top: 28px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.import-tip {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.upload-icon {
  font-size: 56px;
  color: var(--el-text-color-placeholder);
}
</style>
