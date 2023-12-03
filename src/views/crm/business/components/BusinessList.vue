<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm">
      <Icon class="mr-5px" icon="ep:opportunity" />
      创建商机
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="商机名称" fixed="left" align="center" prop="name">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="商机金额" align="center" prop="price" :formatter="fenToYuanFormat" />
      <el-table-column label="客户名称" align="center" prop="customerName" />
      <el-table-column label="商机组" align="center" prop="statusTypeName" />
      <el-table-column label="商机阶段" align="center" prop="statusName" />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加 -->
  <BusinessForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts">
import * as BusinessApi from '@/api/crm/business'
import BusinessForm from './../BusinessForm.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import { fenToYuanFormat } from '@/utils/formatter'

defineOptions({ name: 'CrmBusinessList' })
const props = defineProps<{
  bizType: number // 业务类型
  bizId: number // 业务编号
}>()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerId: undefined as unknown // 允许 undefined + number
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 置空参数
    queryParams.customerId = undefined
    // 执行查询
    let data = { list: [], total: 0 }
    switch (props.bizType) {
      case BizTypeEnum.CRM_CUSTOMER:
        queryParams.customerId = props.bizId
        data = await BusinessApi.getBusinessPageByCustomer(queryParams)
        break
      default:
        return
    }
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

/** 添加操作 */
const formRef = ref()
const openForm = () => {
  formRef.value.open('create')
}

/** 打开联系人详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmBusinessDetail', params: { id } })
}

/** 监听打开的 bizId + bizType，从而加载最新的列表 */
watch(
  () => [props.bizId, props.bizType],
  () => {
    handleQuery()
  },
  { immediate: true, deep: true }
)
</script>
