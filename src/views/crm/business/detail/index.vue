<template>
  <BusinessDetailsHeader v-loading="loading" :business="business">
    <el-button v-if="permissionListRef?.validateWrite" @click="openForm('update', business.id)">
      编辑
    </el-button>
    <el-button
      v-if="permissionListRef?.validateWrite"
      :disabled="business.endStatus"
      type="success"
      @click="openStatusForm()"
    >
      变更商机状态
    </el-button>
    <el-button v-if="permissionListRef?.validateOwnerUser" type="primary" @click="transfer">
      转移
    </el-button>
  </BusinessDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="跟进记录">
        <FollowUpList :biz-id="businessId" :biz-type="BizTypeEnum.CRM_BUSINESS" />
      </el-tab-pane>
      <el-tab-pane label="详细资料">
        <BusinessDetailsInfo :business="business" />
      </el-tab-pane>
      <el-tab-pane label="联系人" lazy>
        <ContactList
          :biz-id="business.id!"
          :biz-type="BizTypeEnum.CRM_BUSINESS"
          :business-id="business.id"
          :customer-id="business.customerId"
        />
      </el-tab-pane>
      <el-tab-pane label="产品">
        <BusinessProductList :business="business" />
      </el-tab-pane>
      <el-tab-pane label="合同" lazy>
        <ContractList :biz-id="business.id!" :biz-type="BizTypeEnum.CRM_BUSINESS" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
      <el-tab-pane label="团队成员">
        <PermissionList
          ref="permissionListRef"
          :biz-id="business.id!"
          :biz-type="BizTypeEnum.CRM_BUSINESS"
          :show-action="true"
          @quit-team="close"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <BusinessForm ref="formRef" @success="getBusiness" />
  <BusinessUpdateStatusForm ref="statusFormRef" @success="getBusiness" />
  <CrmTransferForm ref="transferFormRef" :biz-type="BizTypeEnum.CRM_BUSINESS" @success="close" />
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as BusinessApi from '@/api/crm/business'
import BusinessDetailsHeader from './BusinessDetailsHeader.vue'
import BusinessDetailsInfo from './BusinessDetailsInfo.vue'
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import { BizTypeEnum } from '@/api/crm/permission'
import { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/crm/operateLog'
import BusinessForm from '@/views/crm/business/BusinessForm.vue'
import CrmTransferForm from '@/views/crm/permission/components/TransferForm.vue'
import FollowUpList from '@/views/crm/followup/index.vue'
import ContactList from '@/views/crm/contact/components/ContactList.vue'
import BusinessUpdateStatusForm from '@/views/crm/business/BusinessUpdateStatusForm.vue'
import ContractList from '@/views/crm/contract/components/ContractList.vue'
import BusinessProductList from '@/views/crm/business/detail/BusinessProductList.vue'

defineOptions({ name: 'CrmBusinessDetail' })

const message = useMessage()

const businessId = ref(0) // 线索编号
const loading = ref(true) // 加载中
const business = ref<BusinessApi.BusinessVO>({} as BusinessApi.BusinessVO) // 商机详情
const permissionListRef = ref<InstanceType<typeof PermissionList>>() // 团队成员列表 Ref

/** 获取详情 */
const getBusiness = async () => {
  loading.value = true
  try {
    business.value = await BusinessApi.getBusiness(businessId.value)
    await getOperateLog(businessId.value)
  } finally {
    loading.value = false
  }
}

/** 编辑 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 变更商机状态 */
const statusFormRef = ref()
const openStatusForm = () => {
  statusFormRef.value.open(business.value)
}

/** 联系人转移 */
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 联系人转移表单 ref
const transfer = () => {
  transferFormRef.value?.open(business.value.id)
}

/** 获取操作日志 */
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const getOperateLog = async (contactId: number) => {
  if (!contactId) {
    return
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_BUSINESS,
    bizId: contactId
  })
  logList.value = data.list
}

/** 关闭窗口 */
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
}

/** 初始化 */
const { params } = useRoute()
onMounted(async () => {
  if (!params.id) {
    message.warning('参数错误，商机不能为空！')
    close()
    return
  }
  businessId.value = params.id as unknown as number
  await getBusiness()
})
</script>
