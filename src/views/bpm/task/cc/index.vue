<!-- 工作流 - 抄送我的流程 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form ref="queryFormRef" :inline="true" class="-mb-15px" label-width="68px">
      <el-form-item label="流程名称" prop="name">
        <el-input
          v-model="queryParams.processInstanceName"
          class="!w-240px"
          clearable
          placeholder="请输入流程名称"
        />
      </el-form-item>
      <el-form-item label="所属流程" prop="processDefinitionId">
        <el-input
          v-model="queryParams.processInstanceId"
          placeholder="请输入流程定义的编号"
          clearable
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="抄送时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="所属流程" prop="processInstanceId" width="300px" />
      <el-table-column align="center" label="流程名称" prop="processInstanceName" />
      <el-table-column align="center" label="任务名称" prop="taskName" />
      <el-table-column align="center" label="流程发起人" prop="startUserNickname" />
      <el-table-column align="center" label="抄送发起人" prop="creatorNickname" />
      <el-table-column align="center" label="抄送原因" prop="reason" />
      <el-table-column
        align="center"
        label="抄送时间"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column align="center" label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handleAudit(scope.row)">跳转待办</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmCCProcessInstance' })

const { push } = useRouter() // 路由

const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  processInstanceId: '',
  processInstanceName: '',
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProcessInstanceApi.getProcessInstanceCCPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 处理审批按钮 */
const handleAudit = (row: any) => {
  push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstanceId
    }
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
