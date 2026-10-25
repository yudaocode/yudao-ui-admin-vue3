<template>
  <!-- 页面头部 -->
  <ContentWrap>
    <el-page-header
      :content="`${formatHrmYearMonth(record.year, record.month)} 工资条发放详情`"
      @back="close"
    />
  </ContentWrap>

  <!-- 工资条列表 -->
  <SalarySlipList v-if="record.id" v-loading="loading" :send-record-id="record.id" />
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import { useTagsViewStore } from '@/store/modules/tagsView'
import * as SalarySlipSendRecordApi from '@/api/hrm/salary/slip/send-record'
import { formatHrmYearMonth } from '@/views/hrm/utils/format'
import SalarySlipList from './SalarySlipList.vue'

defineOptions({ name: 'HrmSalarySlipSendRecordDetail' })

const route = useRoute() // 路由
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const recordId = (parseId(route.params.id) as number) // 发放记录编号
const loading = ref(false) // 详情加载中
const record = ref<SalarySlipSendRecordApi.SalarySlipSendRecordVO>({}) // 发放记录

/** 关闭详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmSalarySlipSendRecord' })
}

/** 查询发放记录 */
async function getRecord() {
  loading.value = true
  try {
    record.value = await SalarySlipSendRecordApi.getSalarySlipSendRecord(recordId)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getRecord()
})
</script>
