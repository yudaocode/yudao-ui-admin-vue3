<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['bpm:task:done:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" align="center">
      <el-table-column label="任务编号" align="center" prop="id" width="300px" />
      <el-table-column label="任务名称" align="center" prop="name" />
      <el-table-column label="所属流程" align="center" prop="processInstance.name" />
      <el-table-column label="流程发起人" align="center" prop="processInstance.startUserNickname" />
      <el-table-column label="状态" align="center" prop="result">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT" :value="scope.row.result" />
        </template>
      </el-table-column>
      <el-table-column label="原因" align="center" prop="reason" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button link type="primary" @click="openModal(scope.row)"> 流程信息 </el-button>
          <el-button link type="primary" @click="handleAudit(scope.row)"> 流程详情 </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 表单弹窗：详情 -->
  <TaskDoneDetail ref="modalRef" @success="getList" />
</template>
<script setup lang="tsx">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as TaskApi from '@/api/bpm/task'
import download from '@/utils/download'
import TaskDoneDetail from './Taskdetail.vue'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const message = useMessage() // 消息弹窗
const exportLoading = ref(false) // 导出的加载中
const queryFormRef = ref() // 搜索的表单
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  status: undefined,
  createTime: []
})

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
/** 详情操作 */
const modalRef = ref()
const openModal = (data: TaskApi.TaskVO) => {
  modalRef.value.openModal(data)
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}
/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TaskApi.getDoneTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await TaskApi.exportTask(queryParams)
    download.excel(data, '任务列表.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}
const { push } = useRouter() // 路由
// 处理审批按钮
const handleAudit = (row) => {
  push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstance.id
    }
  })
}
/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
