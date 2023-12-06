<template>
  <ContactDetailsHeader :contact="contact" :loading="loading" @refresh="getContactData(id)" />
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <ContactDetailsInfo :contact="contact" />
      </el-tab-pane>
      <el-tab-pane label="操作日志" lazy>TODO 待开发</el-tab-pane>
      <el-tab-pane label="团队成员" lazy>
        <PermissionList :biz-id="contact.id!" :biz-type="BizTypeEnum.CRM_CONTACT" />
      </el-tab-pane>
      <el-tab-pane label="商机" lazy>
        <BusinessList :biz-id="contact.id!" :biz-type="BizTypeEnum.CRM_CONTACT" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ContactApi from '@/api/crm/contact'
import ContactDetailsHeader from '@/views/crm/contact/detail/ContactDetailsHeader.vue'
import ContactDetailsInfo from '@/views/crm/contact/detail/ContactDetailsInfo.vue'
import BusinessList from '@/views/crm/contactBusinessLink/components/BusinessListByContact.vue' // 商机列表
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import { BizTypeEnum } from '@/api/crm/permission'

defineOptions({ name: 'CrmContactDetail' })

const route = useRoute()
const id = Number(route.params.id) // 联系人编号
const loading = ref(true) // 加载中
const contact = ref<ContactApi.ContactVO>({} as ContactApi.ContactVO) // 联系人详情

/** 获取详情 */
const getContactData = async (id: number) => {
  loading.value = true
  try {
    contact.value = await ContactApi.getContact(id)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
onMounted(async () => {
  if (!id) {
    ElMessage.warning('参数错误，联系人不能为空！')
    delView(unref(currentRoute))
    return
  }
  await getContactData(id)
})
</script>
