<template>
  <CustomerDetailsTop :customer="customer" :loading="loading" @refresh="getCustomerData(id)" />
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <CustomerDetails :customer="customer" />
      </el-tab-pane>
      <el-tab-pane label="活动" lazy> 活动</el-tab-pane>
      <el-tab-pane label="邮件" lazy> 邮件</el-tab-pane>
      <el-tab-pane label="工商信息" lazy> 工商信息</el-tab-pane>
      <el-tab-pane label="客户关系" lazy> 客户关系</el-tab-pane>
      <!-- TODO wanwan 以下标签上的数量需要接口统计返回 -->
      <el-tab-pane label="联系人" lazy>
        <template #label>
          联系人
          <el-badge class="item" type="primary" />
        </template>
        联系人
      </el-tab-pane>
      <el-tab-pane label="团队成员" lazy>
        <template #label>
          团队成员
          <el-badge class="item" type="primary" />
        </template>
        <CrmPermissionList :biz-id="customer.id" :biz-type="CrmBizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="商机" lazy> 商机</el-tab-pane>
      <el-tab-pane label="合同" lazy>
        <template #label>
          合同
          <el-badge class="item" type="primary" />
        </template>
        合同
      </el-tab-pane>
      <el-tab-pane label="回款" lazy>
        <template #label>
          回款
          <el-badge class="item" type="primary" />
        </template>
        回款
      </el-tab-pane>
      <el-tab-pane label="回访" lazy> 回访</el-tab-pane>
      <el-tab-pane label="发票" lazy> 发票</el-tab-pane>
    </el-tabs>
  </el-col>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as CustomerApi from '@/api/crm/customer'
import CustomerBasicInfo from '@/views/crm/customer/detail/CustomerBasicInfo.vue'
import { DICT_TYPE } from '@/utils/dict'
import CustomerDetails from '@/views/crm/customer/detail/CustomerDetails.vue'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'
import { CrmBizTypeEnum, CrmPermissionList } from '@/views/crm/components'

defineOptions({ name: 'CustomerDetail' })

const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
const { currentRoute } = useRouter() // 路由
const id = Number(route.params.id)
const loading = ref(true) // 加载中

/**
 * 获取详情
 *
 * @param id
 */
const customer = ref<CustomerApi.CustomerVO>({} as CustomerApi.CustomerVO) // 客户详情
const getCustomerData = async (id: number) => {
  loading.value = true
  try {
    customer.value = await CustomerApi.getCustomer(id)
  } finally {
    loading.value = false
  }
}

/**
 * 初始化
 */
onMounted(() => {
  if (!id) {
    ElMessage.warning('参数错误，客户不能为空！')
    delView(unref(currentRoute))
    return
  }
  getCustomerData(id)
})
</script>
