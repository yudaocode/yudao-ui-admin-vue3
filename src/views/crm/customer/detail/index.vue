<template>
  <CustomerDetailsHeader :customer="customer" :loading="loading" @refresh="getCustomer(id)" />
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <CustomerDetailsInfo :customer="customer" />
      </el-tab-pane>
      <el-tab-pane label="操作日志" lazy>TODO 待开发</el-tab-pane>
      <el-tab-pane label="联系人" lazy>
        <ContactList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="团队成员" lazy>
        <PermissionList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="商机" lazy>
        <BusinessList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="合同" lazy>
        <ContractList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="回款" lazy>
        <ReceivablePlanList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
        <ReceivableList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="回访" lazy>TODO 待开发</el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as CustomerApi from '@/api/crm/customer'
import CustomerDetailsInfo from './CustomerDetailsInfo.vue' // 客户明细 - 详细信息
import CustomerDetailsHeader from './CustomerDetailsHeader.vue' // 客户明细 - 头部
import ContactList from '@/views/crm/contact/components/ContactList.vue' // 联系人列表
import ContractList from '@/views/crm/contract/components/ContractList.vue' // 合同列表
import BusinessList from '@/views/crm/business/components/BusinessList.vue' // 商机列表
import ReceivableList from '@/views/crm/receivable/components/ReceivableList.vue' // 回款列表
import ReceivablePlanList from '@/views/crm/receivable/plan/components/ReceivablePlanList.vue' // 回款计划列表
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import { BizTypeEnum } from '@/api/crm/permission'

defineOptions({ name: 'CrmCustomerDetail' })

const route = useRoute()
const id = Number(route.params.id) // 客户编号
const loading = ref(true) // 加载中

/** 获取详情 */
const customer = ref<CustomerApi.CustomerVO>({} as CustomerApi.CustomerVO) // 客户详情
const getCustomer = async (id: number) => {
  loading.value = true
  try {
    customer.value = await CustomerApi.getCustomer(id)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
onMounted(() => {
  if (!id) {
    ElMessage.warning('参数错误，客户不能为空！')
    delView(unref(currentRoute))
    return
  }
  getCustomer(id)
})
</script>
