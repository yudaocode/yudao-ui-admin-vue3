<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm">
      <Icon class="mr-5px" icon="system-uicons:contacts" />
      创建联系人
    </el-button>
    <el-button
      v-if="queryParams.businessId"
      v-hasPermi="['crm:contact:create-business']"
      @click="openBusinessModal"
    >
      <Icon class="mr-5px" icon="ep:circle-plus" />
      关联
    </el-button>
    <el-button
      v-if="queryParams.businessId"
      v-hasPermi="['crm:contact:delete-business']"
      @click="deleteContactBusinessList"
    >
      <Icon class="mr-5px" icon="ep:remove" />
      解除关联
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table
      ref="contactRef"
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
    >
      <el-table-column v-if="queryParams.businessId" type="selection" width="55" />
      <el-table-column align="center" fixed="left" label="姓名" prop="name">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="手机号" prop="mobile" />
      <el-table-column align="center" label="职位" prop="post" />
      <el-table-column align="center" label="直属上级" prop="parentName" />
      <el-table-column align="center" label="是否关键决策人" min-width="100" prop="master">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.master" />
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加 -->
  <ContactForm ref="formRef" @success="getList" />
  <!-- 关联商机选择弹框 -->
  <ContactListModal
    v-if="customerId"
    ref="contactModalRef"
    :customer-id="customerId"
    @success="createContactBusinessList"
  />
</template>
<script lang="ts" setup>
import * as ContactApi from '@/api/crm/contact'
import ContactForm from './../ContactForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { BizTypeEnum } from '@/api/crm/permission'
import ContactListModal from './ContactListModal.vue'

defineOptions({ name: 'CrmContactList' })
const props = defineProps<{
  bizType: number // 业务类型
  bizId: number // 业务编号
  customerId?: number // 特殊：客户编号；在【商机】详情中，可以传递客户编号，默认新建的联系人关联到该客户
  businessId?: number // 特殊：商机编号；在【商机】详情中，可以传递商机编号，默认新建的联系人关联到该商机
}>()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerId: undefined as unknown, // 允许 undefined + number
  businessId: undefined as unknown // 允许 undefined + number
})
const message = useMessage()

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
        data = await ContactApi.getContactPageByCustomer(queryParams)
        break
      case BizTypeEnum.CRM_BUSINESS:
        queryParams.businessId = props.bizId
        data = await ContactApi.getContactPageByBusiness(queryParams)
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
  formRef.value.open('create', undefined, props.customerId, props.businessId)
}

/** 打开联系人详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}

/** 打开联系人与商机的关联弹窗 */
const contactModalRef = ref()
const openBusinessModal = () => {
  contactModalRef.value.open()
}
const createContactBusinessList = async (contactIds: number[]) => {
  const data = {
    businessId: props.bizId,
    contactIds: contactIds
  } as ContactApi.ContactBusiness2ReqVO
  contactRef.value.getSelectionRows().forEach((row: ContactApi.ContactVO) => {
    data.contactIds.push(row.id)
  })
  await ContactApi.createContactBusinessList2(data)
  // 刷新列表
  message.success('关联联系人成功')
  handleQuery()
}

/** 解除联系人与商机的关联 */
const contactRef = ref()
const deleteContactBusinessList = async () => {
  const data = {
    businessId: props.bizId,
    contactIds: contactRef.value.getSelectionRows().map((row: ContactApi.ContactVO) => row.id)
  } as ContactApi.ContactBusiness2ReqVO
  if (data.contactIds.length === 0) {
    return message.error('未选择联系人')
  }
  await ContactApi.deleteContactBusinessList2(data)
  // 刷新列表
  message.success('取关联系人成功')
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
