<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm">
      <Icon class="mr-5px" icon="ep:opportunity" />
      创建商机
    </el-button>
    <el-button
      @click="openBusinessModal"
      v-hasPermi="['crm:contact:create-business']"
      v-if="queryParams.contactId"
    >
      <Icon class="mr-5px" icon="ep:circle-plus" />关联
    </el-button>
    <el-button
      @click="deleteContactBusinessList"
      v-hasPermi="['crm:contact:delete-business']"
      v-if="queryParams.contactId"
    >
      <Icon class="mr-5px" icon="ep:remove" />解除关联
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table
      ref="businessRef"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column type="selection" width="55" v-if="queryParams.contactId" />
      <el-table-column label="商机名称" fixed="left" align="center" prop="name">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        label="商机金额"
        align="center"
        prop="price"
        :formatter="erpPriceTableColumnFormatter"
      />
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
  <!-- 关联商机选择弹框 -->
  <BusinessListModal
    ref="businessModalRef"
    :customer-id="props.customerId"
    @success="createContactBusinessList"
  />
</template>
<script setup lang="ts">
import * as BusinessApi from '@/api/crm/business'
import * as ContactApi from '@/api/crm/contact'
import BusinessForm from './../BusinessForm.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import BusinessListModal from './BusinessListModal.vue'
import { erpPriceTableColumnFormatter } from '@/utils'

const message = useMessage() // 消息

defineOptions({ name: 'CrmBusinessList' })
const props = defineProps<{
  bizType: number // 业务类型
  bizId: number // 业务编号
  customerId?: number // 关联联系人与商机时，需要传入 customerId 进行筛选
  contactId?: number // 特殊：联系人编号；在【联系人】详情中，可以传递联系人编号，默认新建的商机关联到该联系人
}>()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerId: undefined as unknown, // 允许 undefined + number
  contactId: undefined as unknown // 允许 undefined + number
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 置空参数
    queryParams.customerId = undefined
    queryParams.contactId = undefined
    // 执行查询
    let data = { list: [], total: 0 }
    switch (props.bizType) {
      case BizTypeEnum.CRM_CUSTOMER:
        queryParams.customerId = props.bizId
        data = await BusinessApi.getBusinessPageByCustomer(queryParams)
        break
      case BizTypeEnum.CRM_CONTACT:
        queryParams.contactId = props.bizId
        data = await BusinessApi.getBusinessPageByContact(queryParams)
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
  formRef.value.open('create', null, props.customerId, props.contactId)
}

/** 打开联系人详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmBusinessDetail', params: { id } })
}

/** 打开联系人与商机的关联弹窗 */
const businessModalRef = ref()
const openBusinessModal = () => {
  businessModalRef.value.open()
}
const createContactBusinessList = async (businessIds: number[]) => {
  const data = {
    contactId: props.bizId,
    businessIds: businessIds
  } as ContactApi.ContactBusinessReqVO
  businessRef.value.getSelectionRows().forEach((row: BusinessApi.BusinessVO) => {
    data.businessIds.push(row.id)
  })
  await ContactApi.createContactBusinessList(data)
  // 刷新列表
  message.success('关联商机成功')
  handleQuery()
}

/** 解除联系人与商机的关联 */
const businessRef = ref()
const deleteContactBusinessList = async () => {
  const data = {
    contactId: props.bizId,
    businessIds: businessRef.value.getSelectionRows().map((row: BusinessApi.BusinessVO) => row.id)
  } as ContactApi.ContactBusinessReqVO
  if (data.businessIds.length === 0) {
    return message.error('未选择商机')
  }
  await ContactApi.deleteContactBusinessList(data)
  // 刷新列表
  message.success('取关商机成功')
  handleQuery()
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
