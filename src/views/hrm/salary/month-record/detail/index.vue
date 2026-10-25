<template>
  <!-- 页面头部 -->
  <ContentWrap>
    <el-page-header :content="record.title || '历史工资表详情'" @back="close" />
  </ContentWrap>

  <!-- 工资表概览 -->
  <SalaryMonthRecordDetailsInfo :loading="loading" :record="record" />

  <!-- 员工工资明细 -->
  <SalaryMonthEmployeeRecordList v-if="record.id" :record="record" />
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import { useTagsViewStore } from '@/store/modules/tagsView'
import * as SalaryMonthRecordApi from '@/api/hrm/salary/month-record'
import { HrmSalaryMonthStatus } from '@/views/hrm/utils/constants'
import SalaryMonthEmployeeRecordList from './SalaryMonthEmployeeRecordList.vue'
import SalaryMonthRecordDetailsInfo from './SalaryMonthRecordDetailsInfo.vue'

defineOptions({ name: 'HrmSalaryHistoryDetail' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const recordId = (parseId(route.params.id) as number) // 月度工资表编号
const loading = ref(true) // 详情加载中
const record = ref<SalaryMonthRecordApi.SalaryMonthRecordVO>({}) // 月度工资表

/** 关闭详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmSalaryHistory' })
}

/** 查询月度工资表 */
async function getRecord() {
  loading.value = true
  try {
    const data = await SalaryMonthRecordApi.getSalaryMonthRecord(recordId)
    if (!data || data.status !== HrmSalaryMonthStatus.HISTORY) {
      message.warning('历史工资表不存在')
      close()
      return
    }
    record.value = data
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!isPositiveId(recordId)) {
    message.warning('参数错误，历史工资表不能为空！')
    close()
    return
  }
  await getRecord()
})
</script>
