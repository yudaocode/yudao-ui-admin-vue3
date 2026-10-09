<template>
  <div v-loading="loading">
    <ContentWrap v-for="group in HrmEmployeeFileGroups" :key="group.label" :title="group.label">
      <el-row :gutter="12">
        <el-col v-for="option in group.options" :key="option.value" :span="6">
          <button class="file-category" type="button" @click="openFileDialog(option)">
            <Icon icon="ep:folder-opened" :size="28" />
            <span class="file-category__name">{{ option.label }}</span>
            <span class="file-category__count">{{ getFileUrls(option.value).length }}</span>
          </button>
        </el-col>
      </el-row>
    </ContentWrap>
  </div>

  <!-- 表单弹窗：材料附件 -->
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="620px">
    <UploadFile
      v-model="dialogFileUrls"
      :disabled="!canUpdate"
      :file-type="fileTypes"
      :limit="20"
      :file-size="20"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="canUpdate" type="primary" :loading="saving" @click="saveFiles">
        保存
      </el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { checkPermi } from '@/utils/permission'
import * as EmployeeFileApi from '@/api/hrm/employee/file'
import { HrmEmployeeFileGroups } from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmEmployeeMaterialFiles' })

const props = defineProps<{
  employeeId: number
}>()
const emit = defineEmits<{
  success: []
}>() // 定义 success 事件，用于操作成功后的回调

const message = useMessage() // 消息弹窗
const canUpdate = checkPermi(['hrm:employee:update']) // 是否可编辑材料附件
const fileTypes = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'] // 支持的文件类型
const loading = ref(false) // 列表的加载中
const saving = ref(false) // 保存按钮的加载中
const fileList = ref<EmployeeFileApi.HrmEmployeeFileVO[]>([]) // 材料附件列表
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const selectedType = ref<number>() // 当前附件类型
const dialogFileUrls = ref<string[]>([]) // 当前类型的附件地址数组

/** 获得指定类型的附件地址数组 */
function getFileUrls(type: number) {
  return fileList.value.filter((file) => file.type === type).map((file) => file.url)
}

/** 查询列表 */
async function getFileList() {
  loading.value = true
  try {
    fileList.value = await EmployeeFileApi.getEmployeeFileList(props.employeeId)
  } finally {
    loading.value = false
  }
}

/** 打开弹窗 */
function openFileDialog(option: { label: string; value: number }) {
  selectedType.value = option.value
  dialogTitle.value = option.label
  dialogFileUrls.value = [...getFileUrls(option.value)]
  dialogVisible.value = true
}

/** 保存材料附件 */
async function saveFiles() {
  if (selectedType.value === undefined) {
    return
  }
  // 提交请求
  saving.value = true
  try {
    await EmployeeFileApi.saveEmployeeFiles({
      employeeId: props.employeeId,
      type: selectedType.value,
      fileUrls: dialogFileUrls.value
    })
    message.success('保存成功')
    dialogVisible.value = false
    await getFileList()
    // 发送操作成功的事件
    emit('success')
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getFileList()
})
</script>

<style scoped>
.file-category {
  display: flex;
  width: 100%;
  min-height: 72px;
  padding: 14px 16px;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  align-items: center;
}

.file-category:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.file-category__name {
  flex: 1;
  margin-left: 12px;
}

.file-category__count {
  min-width: 24px;
  text-align: right;
}
</style>
