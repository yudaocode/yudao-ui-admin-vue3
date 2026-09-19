<template>
  <Dialog v-model="dialogVisible" :title="`${workItemTypeName}导入`" width="460px">
    <!-- 导入文件 -->
    <el-upload
      ref="uploadRef"
      v-model:file-list="files"
      :action="importUrl"
      :auto-upload="false"
      :disabled="formLoading"
      :headers="uploadHeaders"
      :limit="1"
      :on-error="submitFormError"
      :on-exceed="handleExceed"
      :on-success="submitFormSuccess"
      accept=".xlsx, .xls"
      drag
    >
      <Icon icon="ep:upload" />
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <span>仅允许导入 xls、xlsx 格式文件。</span>
          <span>处理人请填写用户编号，状态请填写当前项目的状态名称。</span>
          <span
            >优先级、缺陷类型可直接使用模板下拉（缺陷类型仅缺陷填写），标签支持多个名称（用逗号分隔）。</span
          >
          <el-link :underline="false" type="primary" @click="downloadTemplate">下载模板</el-link>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as WorkItemApi from '@/api/pms/pm/workitem'
import { getAccessToken, getTenantId } from '@/utils/auth'
import download from '@/utils/download'
import { PmsWorkItemType } from '@/views/pms/pm/utils/constants'
import { getWorkItemTypeName } from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsWorkItemImportForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 导入中
const uploadRef = ref() // 上传组件 Ref
const uploadHeaders = ref() // 上传请求头
const files = ref([]) // 文件列表
const projectId = ref(0) // 项目编号
const workItemType = ref<number>(PmsWorkItemType.TASK) // 工作项类型
const workItemTypeName = computed(() => getWorkItemTypeName(workItemType.value)) // 工作项类型名称
const importUrl = computed(
  () =>
    import.meta.env.VITE_BASE_URL +
    import.meta.env.VITE_API_URL +
    `/pms/pm/work-item/import?projectId=${projectId.value}&type=${workItemType.value}`
) // 工作项导入地址
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
function open(currentProjectId: number, currentWorkItemType: number) {
  dialogVisible.value = true
  projectId.value = currentProjectId
  workItemType.value = currentWorkItemType
  files.value = []
  resetForm()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
function submitForm() {
  if (!files.value.length) {
    message.error('请上传文件')
    return
  }
  uploadHeaders.value = {
    Authorization: 'Bearer ' + getAccessToken(),
    'tenant-id': getTenantId()
  }
  // 提交请求
  formLoading.value = true
  uploadRef.value?.submit()
}

/** 处理导入成功 */
function submitFormSuccess(response: WorkItemApi.PmsWorkItemImportRespVO) {
  if (response.code !== 0) {
    message.error(response.msg)
    resetForm()
    return
  }
  const failureEntries = Object.entries(response.data.failureReasons)
  const failureText = failureEntries.map(([row, reason]) => `第 ${row} 行：${reason}`).join('；')
  message.alert(
    `导入成功 ${response.data.successCount} 条，失败 ${failureEntries.length} 条` +
      (failureText ? `；${failureText}` : '')
  )
  formLoading.value = false
  dialogVisible.value = false
  emit('success')
}

/** 处理导入失败 */
function submitFormError() {
  message.error('上传失败，请重新上传')
  formLoading.value = false
}

/** 重置表单 */
async function resetForm() {
  formLoading.value = false
  await nextTick()
  uploadRef.value?.clearFiles()
}

/** 处理导入文件超出数量限制 */
function handleExceed() {
  message.error('最多只能上传一个文件')
}

/** 下载导入模板 */
async function downloadTemplate() {
  const data = await WorkItemApi.getWorkItemImportTemplate()
  download.excel(data, '工作项导入模板.xlsx')
}
</script>
