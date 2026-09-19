<template>
  <doc-alert title="【薪资】月度工资、工资条" url="https://doc.iocoder.cn/hrm/salary/payroll/" />

  <div v-if="accessible" v-loading="loading">
    <ContentWrap>
      <div
        class="flex items-center justify-between gap-16px text-18px text-[var(--el-text-color-primary)] font-600"
      >
        <span>我的工资条</span>
        <el-space wrap>
          <el-date-picker
            v-model="monthRange"
            type="monthrange"
            value-format="YYYY-MM"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            class="!w-260px"
            @change="loadSlips"
          />
          <el-select v-model="sort" class="!w-180px" @change="loadSlips">
            <el-option
              v-for="item in HRM_SALARY_SLIP_SORT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button v-if="hasFilter" link type="primary" @click="resetFilter">清除筛选</el-button>
        </el-space>
      </div>
    </ContentWrap>

    <template v-if="slips.length">
      <ContentWrap v-for="(slip, index) in slips" :key="slip.id" :class="index ? 'mt-20px' : ''">
        <div class="mb-12px flex items-center gap-8px text-[var(--el-text-color-primary)] font-600">
          <span>{{ slip.year }} 年 {{ slip.month }} 月工资条</span>
          <el-tag v-if="slip.readStatus === 0" size="small" type="danger">新工资条</el-tag>
        </div>
        <el-table :data="[buildSlipRow(slip)]" border>
          <el-table-column label="所属月份" prop="monthTitle" min-width="110" fixed />
          <template v-for="option in slip.options" :key="option.code ?? option.name">
            <el-table-column v-if="option.children?.length" :label="option.name" align="center">
              <el-table-column
                v-for="child in option.children"
                :key="child.code ?? child.name"
                :label="child.name"
                :prop="`option${child.code}`"
                min-width="120"
              >
                <template #header>
                  <el-tooltip v-if="child.remark" :content="child.remark" placement="top">
                    <span>{{ child.name }} <Icon icon="ep:question-filled" /></span>
                  </el-tooltip>
                  <span v-else>{{ child.name }}</span>
                </template>
                <template #default>¥ {{ formatHrmMoney(child.value) }}</template>
              </el-table-column>
            </el-table-column>
            <el-table-column
              v-else
              :label="option.name"
              :prop="`option${option.code}`"
              min-width="120"
            >
              <template #header>
                <el-tooltip v-if="option.remark" :content="option.remark" placement="top">
                  <span>{{ option.name }} <Icon icon="ep:question-filled" /></span>
                </el-tooltip>
                <span v-else>{{ option.name }}</span>
              </template>
              <template #default>¥ {{ formatHrmMoney(option.value) }}</template>
            </el-table-column>
          </template>
        </el-table>
      </ContentWrap>
    </template>
    <ContentWrap v-else><el-empty description="暂无工资条" /></ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import * as SalarySlipApi from '@/api/hrm/portal/salary/slip'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import { HRM_SALARY_SLIP_SORT_OPTIONS, HrmSalarySlipSort } from '@/views/hrm/utils/constants'
import { formatHrmMoney } from '@/views/hrm/utils/format'

defineOptions({ name: 'HrmPortalSalarySlip' })

const router = useRouter() // 路由
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const monthRange = ref<string[]>([]) // 月份范围
const sort = ref(HrmSalarySlipSort.RECENT_SEND) // 排序方式
const slips = ref<SalarySlipApi.SalarySlipVO[]>([]) // 工资条列表
const hasFilter = computed(
  () => monthRange.value.length > 0 || sort.value !== HrmSalarySlipSort.RECENT_SEND
)

/** 加载工资条 */
async function loadSlips() {
  loading.value = true
  try {
    const params: SalarySlipApi.SalarySlipListReqVO = {}
    if (monthRange.value.length === 2) {
      params.startMonth = monthRange.value[0]
      params.endMonth = monthRange.value[1]
    }
    const sortOption = HRM_SALARY_SLIP_SORT_OPTIONS.find((item) => item.value === sort.value)
    if (sortOption) {
      params.orderType = sortOption.orderType
      params.order = sortOption.order
    }
    const data = (await SalarySlipApi.getSalarySlipList(params)) || []
    slips.value = data
    const unreadIds = data.filter((slip) => slip.readStatus === 0).map((slip) => slip.id)
    if (unreadIds.length) {
      await SalarySlipApi.markSalarySlipRead(unreadIds)
    }
  } finally {
    loading.value = false
  }
}

/** 重置筛选条件 */
function resetFilter() {
  monthRange.value = []
  sort.value = HrmSalarySlipSort.RECENT_SEND
  loadSlips()
}

/** 构建工资条展示行 */
function buildSlipRow(slip: SalarySlipApi.SalarySlipVO) {
  return getLeafOptions(slip.options).reduce<Record<string, string | number>>(
    (row, option) => {
      row[`option${option.code}`] = option.value || 0
      return row
    },
    { monthTitle: `${slip.year}-${String(slip.month).padStart(2, '0')}` }
  )
}

/** 获取工资条末级项目 */
function getLeafOptions(options: SalarySlipApi.SalarySlipOptionVO[]) {
  const result: SalarySlipApi.SalarySlipOptionVO[] = []
  options.forEach((option) => {
    if (option.children?.length) {
      result.push(...getLeafOptions(option.children))
    } else {
      result.push(option)
    }
  })
  return result
}

/** 页面激活时刷新工资条 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await loadSlips()
})
</script>
