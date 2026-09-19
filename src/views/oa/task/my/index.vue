<template>
  <doc-alert
    title="【协作】日程、任务、计划与汇报"
    url="https://doc.iocoder.cn/oa/collaboration/work/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="任务标题" prop="title">
        <el-input
          v-model="queryParams.title"
          clearable
          class="!w-240px"
          placeholder="请输入任务标题"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="任务类型" prop="type">
        <el-select v-model="queryParams.type" clearable class="!w-240px" placeholder="请选择类型">
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_TASK_TYPE)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="任务状态" prop="status">
        <el-select v-model="queryParams.status" clearable class="!w-240px" placeholder="请选择状态">
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_TASK_STATUS)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="取消状态" prop="canceled">
        <el-select
          v-model="queryParams.canceled"
          clearable
          class="!w-240px"
          placeholder="请选择状态"
        >
          <el-option label="正常" :value="false" />
          <el-option label="已取消" :value="true" />
        </el-select>
      </el-form-item>
      <el-form-item label="发布人" prop="publisherUserId">
        <UserSelectV2 v-model="queryParams.publisherUserId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="发布时间" prop="publishTime">
        <el-date-picker
          v-model="queryParams.publishTime"
          class="!w-360px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 任务列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="任务标题" prop="title" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.title }}
          </el-link>
          <el-tag v-if="scope.row.top" class="ml-6px" size="small" type="danger">置顶</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="type" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_TASK_TYPE" :value="scope.row.type ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="发布人" prop="publisherUserName" width="110" />
      <el-table-column label="发布部门" prop="publisherDeptName" width="120" />
      <el-table-column label="我的状态" width="105">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="scope.row.receiverStatus" />
        </template>
      </el-table-column>
      <el-table-column label="进度" min-width="150">
        <template #default="scope">
          <el-progress :percentage="getTaskStatusProgress(scope.row.receiverStatus)" />
        </template>
      </el-table-column>
      <el-table-column label="任务周期" min-width="220">
        <template #default="scope">
          {{ formatDate(scope.row.startTime, 'YYYY-MM-DD') }}
          至 {{ formatDate(scope.row.endTime, 'YYYY-MM-DD') }}
        </template>
      </el-table-column>
      <el-table-column label="取消状态" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.canceled ? 'danger' : 'success'">
            {{ scope.row.canceled ? '已取消' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" prop="publishTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.canceled"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 任务详情 -->
  <OaTaskDetail ref="detailRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance } from 'element-plus'
import * as TaskApi from '@/api/oa/task'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import OaTaskDetail from '../list/components/OaTaskDetail.vue'

import { getTaskStatusProgress } from '@/views/oa/utils/format'

defineOptions({ name: 'OaTaskMy' })

const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表加载中
const list = ref<TaskApi.OaTaskVO[]>([]) // 任务列表
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  type: undefined,
  status: undefined,
  canceled: undefined,
  publisherUserId: undefined,
  publishTime: undefined
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 搜索表单 Ref
const detailRef = ref<InstanceType<typeof OaTaskDetail>>() // 任务详情 Ref

/** 查询任务列表 */
async function getList() {
  loading.value = true
  try {
    const data = await TaskApi.getReceivedTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 打开任务详情 */
function openDetail(id: number) {
  detailRef.value?.open(id, 'received')
}

/** 删除接收的任务 */
async function handleDelete(id: number) {
  try {
    await message.confirm('确认从“我的任务”中删除该任务吗？该操作不会影响其他接收人。')
    await TaskApi.deleteReceivedTask(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
