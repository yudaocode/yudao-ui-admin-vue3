<template>
  <doc-alert
    title="【绩效】绩效考核、绩效档案"
    url="https://doc.iocoder.cn/hrm/performance/assessment/"
  />

  <div v-if="accessible">
    <ContentWrap>
      <el-form
        ref="queryFormRef"
        class="-mb-15px"
        :model="queryParams"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="考核名称" prop="search">
          <el-input
            v-model="queryParams.search"
            class="!w-240px"
            clearable
            placeholder="请输入考核名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" /> 搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" /> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column label="考核名称" prop="name" min-width="220" show-overflow-tooltip />
        <el-table-column label="考核周期" min-width="210">
          <template #default="scope">
            {{ formatHrmDate(scope.row.startTime) }} 至 {{ formatHrmDate(scope.row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="绩效得分" width="110" align="center">
          <template #default="scope">{{ formatHrmScore(scope.row.score) }}</template>
        </el-table-column>
        <el-table-column label="绩效等级" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.resultLevel" type="success" effect="plain">
              {{ scope.row.resultLevel }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="绩效系数" width="100" align="center">
          <template #default="scope">{{ scope.row.coefficient ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="归档时间" width="180">
          <template #default="scope">{{ formatHrmDateTime(scope.row.archiveTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="90" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>

    <PerformanceAssessmentDetail ref="detailRef" />
  </div>
</template>

<script lang="ts" setup>
import * as PerformanceAssessmentApi from '@/api/hrm/portal/performance/assessment'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import { formatHrmDate, formatHrmDateTime, formatHrmScore } from '@/views/hrm/utils/format'
import PerformanceAssessmentDetail from '../detail/index.vue'

defineOptions({ name: 'HrmPortalPerformanceHistory' })

const router = useRouter() // 路由
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const total = ref(0) // 列表总数
const list = ref<PerformanceAssessmentApi.PortalPerformanceAssessmentSummaryVO[]>([]) // 列表数据
const queryFormRef = ref() // 搜索表单 Ref
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  search: undefined,
  archived: true
})
const detailRef = ref<InstanceType<typeof PerformanceAssessmentDetail>>() // 详情组件 Ref

/** 查询我的绩效档案 */
async function getList() {
  loading.value = true
  try {
    const data = await PerformanceAssessmentApi.getPerformanceAssessmentPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 打开绩效档案详情 */
function openDetail(row: PerformanceAssessmentApi.PortalPerformanceAssessmentSummaryVO) {
  detailRef.value?.open(row)
}

/** 页面激活时刷新绩效历史 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await getList()
})
</script>
