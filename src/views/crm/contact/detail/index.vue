<template>
  <ContactDetailsHeader v-loading="loading" :contact="contact">
    <el-button v-if="permissionListRef?.validateWrite" @click="openForm('update', contact.id)">
      编辑
    </el-button>
    <el-button v-if="permissionListRef?.validateOwnerUser" type="primary" @click="transfer">
      转移
    </el-button>
  </ContactDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="跟进记录">
        <FollowUpList :biz-id="contactId" :biz-type="BizTypeEnum.CRM_CONTACT" />
      </el-tab-pane>
      <el-tab-pane label="详细资料">
        <ContactDetailsInfo :contact="contact" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
      <el-tab-pane label="团队成员">
        <PermissionList
          ref="permissionListRef"
          :biz-id="contact.id!"
          :biz-type="BizTypeEnum.CRM_CONTACT"
          :show-action="true"
          @quit-team="close"
        />
      </el-tab-pane>
      <el-tab-pane label="商机" lazy>
        <BusinessList
          :biz-id="contact.id!"
          :biz-type="BizTypeEnum.CRM_CONTACT"
          :contact-id="contact.id"
          :customer-id="contact.customerId"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>
  <!-- 表单弹窗：添加/修改 -->
  <ContactForm ref="formRef" @success="getContact" />
  <CrmTransferForm ref="transferFormRef" :biz-type="BizTypeEnum.CRM_CONTACT" @success="close" />
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ContactApi from '@/api/crm/contact'
import ContactDetailsHeader from '@/views/crm/contact/detail/ContactDetailsHeader.vue'
import ContactDetailsInfo from '@/views/crm/contact/detail/ContactDetailsInfo.vue'
import BusinessList from '@/views/crm/business/components/BusinessList.vue' // 商机列表
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import { BizTypeEnum } from '@/api/crm/permission'
import { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/crm/operateLog'
import ContactForm from '@/views/crm/contact/ContactForm.vue'
import CrmTransferForm from '@/views/crm/permission/components/TransferForm.vue'
import FollowUpList from '@/views/crm/followup/index.vue'

defineOptions({ name: 'CrmContactDetail' })

const message = useMessage()

const contactId = ref(0) // 线索编号
const loading = ref(true) // 加载中
const contact = ref<ContactApi.ContactVO>({} as ContactApi.ContactVO) // 联系人详情
const permissionListRef = ref<InstanceType<typeof PermissionList>>() // 团队成员列表 Ref

/** 获取详情 */
const getContact = async () => {
  loading.value = true
  try {
    contact.value = await ContactApi.getContact(contactId.value)
    await getOperateLog(contactId.value)
  } finally {
    loading.value = false
  }
}

/** 编辑 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 联系人转移 */
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 联系人转移表单 ref
const transfer = () => {
  transferFormRef.value?.open(contact.value.id)
}

/** 获取操作日志 */
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const getOperateLog = async (contactId: number) => {
  if (!contactId) {
    return
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CONTACT,
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
    message.warning('参数错误，联系人不能为空！')
    close()
    return
  }
  contactId.value = params.id as unknown as number
  await getContact()
})
</script>
