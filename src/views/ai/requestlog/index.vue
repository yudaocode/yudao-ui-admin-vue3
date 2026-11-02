<template>
  <doc-alert title="AI 手册" url="https://doc.iocoder.cn/ai/build/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="请求编号" prop="requestId">
        <el-input
          v-model="queryParams.requestId"
          placeholder="请输入请求编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="用户" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select
          v-model="queryParams.bizType"
          placeholder="请选择业务类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模型平台" prop="platform">
        <el-select
          v-model="queryParams.platform"
          placeholder="请选择模型平台"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.AI_PLATFORM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模型" prop="modelId">
        <ModelSelect
          v-model="queryParams.modelId"
          :type="AiModelTypeEnum.CHAT"
          clearable
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模型标识" prop="model">
        <el-input
          v-model="queryParams.model"
          placeholder="请输入模型标识"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="全部（含失败、取消）"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_REQUEST_LOG_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="请求时间" prop="beginTime">
        <el-date-picker
          v-model="queryParams.beginTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 统计：全部匹配筛选条件的记录 -->
  <!-- DONE @AI：单独抽个组件？！（已抽为 RequestLogStatistics 组件，自行管理加载状态和请求序号） -->
  <RequestLogStatistics ref="statisticsRef" />

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="日志编号" align="center" prop="id" width="100" />
      <el-table-column label="请求编号" align="center" prop="requestId" min-width="180" />
      <el-table-column label="用户" align="center" prop="userId" width="140">
        <template #default="scope">
          {{ scope.row.userNickname ?? scope.row.userId }}
        </template>
      </el-table-column>
      <el-table-column label="业务类型" align="center" prop="bizType" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE" :value="scope.row.bizType" />
        </template>
      </el-table-column>
      <el-table-column label="业务编号" align="center" prop="bizId" width="100" />
      <el-table-column label="平台" align="center" prop="platform" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="scope.row.platform" />
        </template>
      </el-table-column>
      <el-table-column label="模型标识" align="center" prop="model" min-width="150" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_REQUEST_LOG_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="输入 Token" align="center" prop="inputTokens" width="100">
        <template #default="scope">{{ formatTokenCount(scope.row.inputTokens) }}</template>
      </el-table-column>
      <el-table-column label="输出 Token" align="center" prop="outputTokens" width="100">
        <template #default="scope">{{ formatTokenCount(scope.row.outputTokens) }}</template>
      </el-table-column>
      <el-table-column label="合计 Token" align="center" prop="totalTokens" width="100">
        <template #default="scope">{{ formatTokenCount(scope.row.totalTokens) }}</template>
      </el-table-column>
      <el-table-column label="耗时" align="center" prop="duration" width="100">
        <template #default="scope">{{ scope.row.duration }} ms</template>
      </el-table-column>
      <el-table-column
        label="请求时间"
        align="center"
        prop="beginTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" fixed="right" width="70">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDetail(scope.row.id)"
            v-hasPermi="['ai:request-log:query']"
          >
            详情
          </el-button>
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

  <!-- 弹窗：详情 -->
  <RequestLogDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { RequestLogApi, RequestLogVO } from '@/api/ai/requestlog'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'
import { formatTokenCount } from '@/views/ai/utils/format'
import RequestLogDetail from './RequestLogDetail.vue'
import RequestLogStatistics from './RequestLogStatistics.vue'

/** AI 请求日志 */
defineOptions({ name: 'AiRequestLog' })

const loading = ref(true) // 列表的加载中
const list = ref<RequestLogVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  requestId: undefined,
  userId: undefined,
  bizType: undefined,
  platform: undefined,
  modelId: undefined,
  model: undefined,
  status: undefined,
  beginTime: []
})
const queryFormRef = ref() // 搜索的表单
const searchParams = ref({}) // 已搜索的筛选条件，分页与统计共用

const statisticsRef = ref<InstanceType<typeof RequestLogStatistics>>() // 统计组件

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await RequestLogApi.getRequestLogPage({
      ...searchParams.value,
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize
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
  searchParams.value = { ...queryParams, beginTime: [...(queryParams.beginTime || [])] }
  getList()
  statisticsRef.value?.getStatistics(searchParams.value)
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 详情操作 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value.open(id)
}

/** 初始化 */
onMounted(() => {
  handleQuery()
  // DONE @AI：后端拼接好；别前端了；（后端分页、详情已返回 userNickname，不再加载用户列表；用户筛选仍用 UserSelectV2）
})
</script>
