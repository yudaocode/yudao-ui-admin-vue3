<template>
  <Dialog v-model="dialogVisible" title="导入辅助核算项目" width="680px">
    <template v-if="!importResult">
      <div class="import-section">
        <div class="section-title">一、请按照数据模板的格式准备要导入的辅助核算项目</div>
        <el-button link type="primary" :loading="templateLoading" @click="downloadTemplate">
          <Icon icon="ep:download" /> 下载《{{ auxiliaryType?.name }}导入模板》
        </el-button>
        <div class="import-tip">{{ templateTip }}</div>
      </div>
      <div class="import-section">
        <div class="section-title">二、请选择需要导入的文件</div>
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
            <div class="el-upload__tip">仅支持 xls、xlsx 格式，文件不能超过 2MB</div>
          </template>
        </el-upload>
      </div>
    </template>

    <template v-else>
      <el-result
        :icon="failureCount ? 'warning' : 'success'"
        :title="failureCount ? '导入完成，部分数据未导入' : '辅助核算项目导入成功'"
        :sub-title="`共 ${importResult.totalCount} 个项目，成功 ${importResult.successItemCodes.length} 个，失败 ${failureCount} 个`"
      />
      <el-table v-if="failureCount" :data="failureRows" border max-height="260px">
        <el-table-column label="导入行" min-width="220" prop="label" show-overflow-tooltip />
        <el-table-column label="失败原因" min-width="260" prop="reason" show-overflow-tooltip />
      </el-table>
    </template>

    <template #footer>
      <template v-if="!importResult">
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
import type { UploadInstance, UploadRawFile, UploadUserFile } from 'element-plus'

import { FmsAuxiliaryItemApi } from '@/api/fms/config/auxiliary/item'
import type { FmsAuxiliaryItemImportRespVO } from '@/api/fms/config/auxiliary/item'
import type { FmsAuxiliaryTypeVO } from '@/api/fms/config/auxiliary/type'
import download from '@/utils/download'
import { FMS_AUXILIARY_TYPE } from '@/views/fms/utils/constants'

defineOptions({ name: 'FmsAuxiliaryItemImportForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 导入的加载中
const templateLoading = ref(false) // 模板下载的加载中
const accountSetId = ref(0) // 账套编号
const auxiliaryType = ref<FmsAuxiliaryTypeVO>() // 辅助核算类别
const fileList = ref<UploadUserFile[]>([]) // 上传文件列表
const importResult = ref<FmsAuxiliaryItemImportRespVO>() // 导入结果
const uploadRef = ref<UploadInstance>() // 上传 Ref
const failureRows = computed(() =>
  Object.entries(importResult.value?.failureReasons || {}).map(([label, reason]) => ({
    label,
    reason
  }))
) // 导入失败列表
const failureCount = computed(() => failureRows.value.length) // 导入失败数量
const templateTip = computed(() => {
  if (
    auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.CUSTOMER ||
    auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.SUPPLIER
  ) {
    return '编码、名称为必填项，备注可选；已有编码不会被覆盖'
  }
  if (auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.INVENTORY) {
    return '编码、名称为必填项，规格、单位可选；已有编码不会被覆盖'
  }
  return '编码、名称为必填项；已有编码不会被覆盖'
}) // 导入模板说明

/** 打开弹窗 */
function open(currentAccountSetId: number, currentAuxiliaryType: FmsAuxiliaryTypeVO) {
  accountSetId.value = currentAccountSetId
  auxiliaryType.value = currentAuxiliaryType
  dialogVisible.value = true
  resetImport()
}
defineExpose({ open })

/** 下载导入模板 */
async function downloadTemplate() {
  if (!auxiliaryType.value) return
  templateLoading.value = true
  try {
    download.excel(
      await FmsAuxiliaryItemApi.getAuxiliaryItemImportTemplate(auxiliaryType.value.type!),
      `${auxiliaryType.value.name}导入模板.xlsx`
    )
  } finally {
    templateLoading.value = false
  }
}

const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于导入成功后的回调

/** 提交导入 */
async function submitImport() {
  const rawFile = fileList.value[0]?.raw
  if (!rawFile || !auxiliaryType.value) {
    message.warning('请选择需要导入的文件')
    return
  }
  if (rawFile.size > 2 * 1024 * 1024) {
    message.error('导入文件不能超过 2MB')
    return
  }
  formLoading.value = true
  try {
    importResult.value = await FmsAuxiliaryItemApi.importAuxiliaryItem(
      accountSetId.value,
      auxiliaryType.value.id!,
      rawFile
    )
    if (importResult.value.successItemCodes.length > 0) {
      emit('success')
    }
  } finally {
    formLoading.value = false
  }
}

/** 重置导入 */
function resetImport() {
  fileList.value = []
  importResult.value = undefined
  nextTick(() => uploadRef.value?.clearFiles())
}

/** 文件数超出时替换为最新选择的文件 */
function handleExceed(files: UploadRawFile[]) {
  uploadRef.value?.clearFiles()
  const file = files[0]
  if (file) {
    uploadRef.value?.handleStart(file)
  }
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
