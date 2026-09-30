<template>
  <doc-alert title="【社保】社保管理" url="https://doc.iocoder.cn/hrm/insurance/" />

  <div v-if="accessible" v-loading="loading">
    <ContentWrap>
      <div
        class="flex items-center justify-between text-18px text-[var(--el-text-color-primary)] font-600"
      >
        <span>社保管理</span>
        <el-date-picker
          v-model="year"
          type="year"
          value-format="YYYY"
          :clearable="false"
          :disabled-date="isYearDisabled"
          class="!w-120px"
          @change="loadRecords"
        />
      </div>
    </ContentWrap>

    <ContentWrap v-if="records.length">
      <el-table :data="records" border>
        <el-table-column label="所属月份" width="110" fixed>
          <template #default="scope">
            {{ scope.row.year }}-{{ String(scope.row.month).padStart(2, '0') }}
          </template>
        </el-table-column>
        <el-table-column label="参保方案" min-width="210">
          <template #default="scope">
            <div>{{ scope.row.schemeName || '-' }}</div>
            <div
              v-if="scope.row.schemeCity"
              class="mt-3px text-12px text-[var(--el-text-color-secondary)]"
            >
              {{ scope.row.schemeCity }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="方案类型" width="100" align="center">
          <template #default="scope">
            <dict-tag
              v-if="scope.row.schemeType"
              :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
              :value="scope.row.schemeType"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="个人社保" min-width="130" align="right">
          <template #default="scope">
            ¥ {{ formatHrmMoney(scope.row.personalInsuranceAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="公司社保" min-width="130" align="right">
          <template #default="scope">
            ¥ {{ formatHrmMoney(scope.row.corporateInsuranceAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="个人公积金" min-width="130" align="right">
          <template #default="scope">
            ¥ {{ formatHrmMoney(scope.row.personalProvidentFundAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="公司公积金" min-width="130" align="right">
          <template #default="scope">
            ¥ {{ formatHrmMoney(scope.row.corporateProvidentFundAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="合计" min-width="140" align="right">
          <template #default="scope">
            <b class="text-[var(--el-color-primary)]">
              ¥ {{ formatHrmMoney(recordTotal(scope.row)) }}
            </b>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>
    <ContentWrap v-else><el-empty description="暂无社保数据" /></ContentWrap>

    <InsuranceRecordDetail ref="detailRef" />
  </div>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as InsuranceRecordApi from '@/api/hrm/portal/insurance/record'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import { formatHrmMoney } from '@/views/hrm/utils/format'
import InsuranceRecordDetail from './InsuranceRecordDetail.vue'

defineOptions({ name: 'HrmPortalInsurance' })

const router = useRouter() // 路由
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const year = ref(formatDate(new Date(), 'YYYY')) // 年份
const firstYear = ref<number>() // 首个参保年份
const allRecords = ref<InsuranceRecordApi.InsuranceRecordVO[]>([]) // 全部参保记录
const records = ref<InsuranceRecordApi.InsuranceRecordVO[]>([]) // 参保记录列表
const detailRef = ref<InstanceType<typeof InsuranceRecordDetail>>() // 详情组件 Ref

/** 加载参保记录 */
function loadRecords() {
  records.value = allRecords.value.filter((record) => record.year === Number(year.value))
}

/** 年份是否不可选择 */
function isYearDisabled(date: Date) {
  return firstYear.value !== undefined && date.getFullYear() < firstYear.value
}

/** 初始化社保记录 */
async function init() {
  loading.value = true
  try {
    allRecords.value = (await InsuranceRecordApi.getInsuranceRecordList()) || []
    const years = allRecords.value.map((record) => record.year)
    if (years.length) {
      firstYear.value = Math.min(...years)
      year.value = String(Math.max(...years))
    }
    loadRecords()
  } finally {
    loading.value = false
  }
}

/** 计算个人缴纳合计 */
function personalTotal(record?: InsuranceRecordApi.InsuranceRecordVO) {
  return (record?.personalInsuranceAmount || 0) + (record?.personalProvidentFundAmount || 0)
}

/** 计算公司缴纳合计 */
function corporateTotal(record?: InsuranceRecordApi.InsuranceRecordVO) {
  return (record?.corporateInsuranceAmount || 0) + (record?.corporateProvidentFundAmount || 0)
}

/** 计算参保记录合计 */
function recordTotal(record?: InsuranceRecordApi.InsuranceRecordVO) {
  return personalTotal(record) + corporateTotal(record)
}

/** 打开详情 */
function openDetail(record: InsuranceRecordApi.InsuranceRecordVO) {
  detailRef.value?.open(record)
}

/** 页面激活时刷新参保记录 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await init()
})
</script>
