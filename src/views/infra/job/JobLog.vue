<template>
  <content-wrap>
    <!-- 搜索栏 -->
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="120px">
      <el-form-item label="处理器的名字" prop="handlerName">
        <el-input
          v-model="queryParams.handlerName"
          placeholder="请输入处理器的名字"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="开始执行时间" prop="beginTime">
        <el-date-picker
          clearable
          v-model="queryParams.beginTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择开始执行时间"
        />
      </el-form-item>
      <el-form-item label="结束执行时间" prop="endTime">
        <el-date-picker
          clearable
          v-model="queryParams.endTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择结束执行时间"
        />
      </el-form-item>
      <el-form-item label="任务状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择任务状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.INFRA_JOB_LOG_STATUS)"
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
          v-hasPermi="['infra:job:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="日志编号" align="center" prop="id" />
      <el-table-column label="任务编号" align="center" prop="jobId" />
      <el-table-column label="处理器的名字" align="center" prop="handlerName" />
      <el-table-column label="处理器的参数" align="center" prop="handlerParam" />
      <el-table-column label="第几次执行" align="center" prop="executeIndex" />
      <el-table-column label="执行时间" align="center" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.beginTime) + ' ~ ' + parseTime(scope.row.endTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行时长" align="center" prop="duration">
        <template #default="scope">
          <span>{{ scope.row.duration + ' 毫秒' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_JOB_LOG_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            icon="el-icon-view"
            @click="handleView(scope.row.id)"
            :loading="exportLoading"
            v-hasPermi="['infra:job:query']"
            >详细
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </content-wrap>
  <!-- 表单弹窗：查看 -->
  <log-view ref="viewModalRef" @success="getList" />
</template>

<script setup lang="ts" name="JobLog">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import LogView from './JobLogView.vue'
import * as JobLogApi from '@/api/infra/jobLog'
import { parseTime } from './utils'

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  handlerName: undefined,
  beginTime: undefined,
  endTime: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await JobLogApi.getJobLogPageApi({
      ...queryParams,
      beginTime: queryParams.beginTime ? queryParams.beginTime + ' 00:00:00' : undefined,
      endTime: queryParams.endTime ? queryParams.endTime + ' 23:59:59' : undefined
    })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 查看操作 */
const viewModalRef = ref()
const handleView = (rowId?: number) => {
  viewModalRef.value.openModal(rowId)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await JobLogApi.exportJobLogApi(queryParams)
    download.excel(data, '定时任务执行日志.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
