<template>
  <Dialog title="选择要导入的模型" v-model="dialogVisible" width="640px">
    <!-- 按模型标识过滤 -->
    <el-input v-model="keyword" placeholder="请输入模型标识" clearable class="!w-240px mb-10px">
      <template #prefix><Icon icon="ep:search" /></template>
    </el-input>
    <el-table
      ref="tableRef"
      row-key="model"
      v-loading="loading"
      :data="filteredList"
      height="400"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
    >
      <!-- 已导入的模型不可勾选 -->
      <el-table-column
        type="selection"
        width="55"
        :selectable="(row: RemoteModel) => !row.imported"
        reserve-selection
      />
      <el-table-column label="序号" type="index" align="center" width="60" />
      <el-table-column label="模型标识" align="center" prop="model" min-width="200" />
      <el-table-column label="状态" align="center" width="110">
        <template #default="scope">
          <el-tag v-if="scope.row.imported" type="info">已导入</el-tag>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty :description="loading ? '远程模型拉取中' : '远程暂未返回可用模型'" />
      </template>
    </el-table>
    <template #footer>
      <el-button
        @click="submitImport"
        type="primary"
        :disabled="isEmpty(checkedModels) || submitLoading"
      >
        导 入（{{ checkedModels.length }}）
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { isEmpty } from '@/utils/is'
import { ModelApi, RemoteModel } from '@/api/ai1/model'

/** AI1 远程模型导入弹窗 */
defineOptions({ name: 'Ai1ModelImportForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 列表的加载中
const submitLoading = ref(false) // 导入的加载中
const providerId = ref<number>() // 模型供应商编号
const list = ref<RemoteModel[]>([]) // 远程模型列表
const keyword = ref('') // 搜索关键词
const checkedModels = ref<string[]>([]) // 已勾选的模型标识
const tableRef = ref() // 表格 Ref

/** 过滤后的列表 */
const filteredList = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) {
    return list.value
  }
  return list.value.filter((item) => item.model.toLowerCase().includes(value))
})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  providerId.value = id
  list.value = []
  keyword.value = ''
  checkedModels.value = []
  tableRef.value?.clearSelection()
  loading.value = true
  try {
    list.value = await ModelApi.getRemoteModelList(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 勾选变化 */
const handleSelectionChange = (records: RemoteModel[]) => {
  checkedModels.value = records.map((item) => item.model)
}

/** 提交导入 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitImport = async () => {
  if (isEmpty(checkedModels.value)) {
    message.warning('请选择要导入的模型')
    return
  }
  submitLoading.value = true
  try {
    const count = await ModelApi.importRemoteModelList({
      providerId: providerId.value!,
      models: checkedModels.value
    })
    message.success(`成功导入 ${count} 个模型`)
    dialogVisible.value = false
    emit('success')
  } finally {
    submitLoading.value = false
  }
}
</script>
