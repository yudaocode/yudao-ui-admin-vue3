<!-- TODO @puhui999：这个组件的注释加下，方便大家打开就知道哈 -->
<template>
  <ContractDetailsHeader v-loading="loading" :contract="contract">
    <el-button v-if="permissionListRef?.validateWrite" @click="openForm('update', contract.id)">
      编辑
    </el-button>
    <el-button v-if="permissionListRef?.validateOwnerUser" type="primary" @click="transfer">
      转移
    </el-button>
  </ContractDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <ContractDetailsInfo :contract="contract" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
      <el-tab-pane label="团队成员">
        <PermissionList
          ref="permissionListRef"
          :biz-id="contract.id!"
          :biz-type="BizTypeEnum.CRM_CONTRACT"
          :show-action="!permissionListRef?.isPool || false"
          @quit-team="close"
        />
      </el-tab-pane>
      <el-tab-pane label="商机" lazy>
        <BusinessList
          :biz-id="contract.id!"
          :biz-type="BizTypeEnum.CRM_CONTRACT"
          :customer-id="contract.customerId"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>
  <!-- 表单弹窗：添加/修改 -->
  <ContractForm ref="formRef" @success="getContractData" />
  <CrmTransferForm ref="crmTransferFormRef" @success="close" />
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { OperateLogV2VO } from '@/api/system/operatelog'
import * as ContractApi from '@/api/crm/contract'
import ContractDetailsHeader from './ContractDetailsHeader.vue'
import ContractDetailsInfo from './ContractDetailsInfo.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import { getOperateLogPage } from '@/api/crm/operateLog'
import ContractForm from '@/views/crm/contract/ContractForm.vue'
import CrmTransferForm from '@/views/crm/permission/components/TransferForm.vue'
import PermissionList from '@/views/crm/permission/components/PermissionList.vue'
import BusinessList from '@/views/crm/business/components/BusinessList.vue'

defineOptions({ name: 'CrmContractDetail' })

const route = useRoute()
const message = useMessage()
const contractId = ref(0) // 编号
const loading = ref(true) // 加载中
const contract = ref<ContractApi.ContractVO>({} as ContractApi.ContractVO) // 详情
const permissionListRef = ref<InstanceType<typeof PermissionList>>() // 团队成员列表 Ref

/** 编辑 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 获取详情 */
const getContractData = async () => {
  loading.value = true
  try {
    await getOperateLog(contractId.value)
    contract.value = await ContractApi.getContract(contractId.value)
  } finally {
    loading.value = false
  }
}

/** 获取操作日志 */
const logList = ref<OperateLogV2VO[]>([]) // 操作日志列表
const getOperateLog = async (contractId: number) => {
  if (!contractId) {
    return
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CONTRACT,
    bizId: contractId
  })
  logList.value = data.list
}

/** 转移 */
// TODO @puhui999：transferFormRef 简洁一点哈
const crmTransferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 合同转移表单 ref
const transfer = () => {
  crmTransferFormRef.value?.open('合同转移', contract.value.id, ContractApi.transfer)
}

/** 关闭 */
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
}

/** 初始化 */
onMounted(async () => {
  const id = route.params.id
  if (!id) {
    message.warning('参数错误，合同不能为空！')
    close()
    return
  }
  contractId.value = id as unknown as number
  await getContractData()
})
</script>
