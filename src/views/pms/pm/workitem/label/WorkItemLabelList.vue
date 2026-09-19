<template>
  <Dialog v-model="dialogVisible" title="工作项标签管理" width="680px">
    <div class="mb-12px flex justify-end">
      <el-button type="primary" @click="openForm()">新增标签</el-button>
    </div>
    <!-- 标签列表 -->
    <el-table v-loading="loading" :data="labelList" :show-overflow-tooltip="true">
      <el-table-column label="标签" min-width="220">
        <template #default="scope">
          <el-tag :color="scope.row.color" effect="dark">{{ scope.row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="颜色" prop="color" width="140" />
      <el-table-column align="center" label="操作" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm(scope.row)">编辑</el-button>
          <el-popconfirm
            cancel-button-text="取消"
            confirm-button-text="确定"
            :title="`确认删除标签“${scope.row.name}”吗？`"
            width="240"
            @confirm="handleDelete(scope.row)"
          >
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>

  <!-- 标签表单 -->
  <WorkItemLabelForm ref="formRef" @success="handleFormSuccess" />
</template>

<script lang="ts" setup>
import * as WorkItemLabelApi from '@/api/pms/pm/workitem/label'
import WorkItemLabelForm from './WorkItemLabelForm.vue'

defineOptions({ name: 'PmsWorkItemLabelList' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 管理弹窗是否显示
const loading = ref(false) // 标签加载中
const labelList = ref<WorkItemLabelApi.PmsWorkItemLabelVO[]>([]) // 标签列表
const formRef = ref<InstanceType<typeof WorkItemLabelForm>>() // 标签表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open() {
  dialogVisible.value = true
  await getWorkItemLabelList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询工作项标签列表 */
async function getWorkItemLabelList() {
  loading.value = true
  try {
    labelList.value = await WorkItemLabelApi.getWorkItemLabelList()
  } finally {
    loading.value = false
  }
}

/** 打开标签表单 */
function openForm(label?: WorkItemLabelApi.PmsWorkItemLabelVO) {
  formRef.value?.open(label?.id)
}

/** 标签表单提交成功 */
async function handleFormSuccess() {
  await getWorkItemLabelList()
  emit('success')
}

/** 删除工作项标签 */
async function handleDelete(label: WorkItemLabelApi.PmsWorkItemLabelVO) {
  if (!label.id) return
  await WorkItemLabelApi.deleteWorkItemLabel(label.id)
  message.success('删除成功')
  await getWorkItemLabelList()
  emit('success')
}
</script>
