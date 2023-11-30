<template>
  <!-- TODO 芋艿：要不要把 3 到 62 合并成一个组件 -->
  <div v-loading="loading">
    <div class="flex items-start justify-between">
      <div>
        <!-- 左上：客户基本信息 -->
        <ContactBasicInfo :contact="contact" />
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button @click="openForm('update', contact.id)" v-hasPermi="['crm:contact:update']">
          编辑
        </el-button>
      </div>
    </div>
    <el-row class="mt-10px">
      <el-button>
        <Icon icon="ph:calendar-fill" class="mr-5px" />
        创建任务
      </el-button>
      <el-button>
        <Icon icon="carbon:email" class="mr-5px" />
        发送邮件
      </el-button>
      <el-button>
        <Icon icon="system-uicons:contacts" class="mr-5px" />
        创建联系人
      </el-button>
      <el-button>
        <Icon icon="ep:opportunity" class="mr-5px" />
        创建商机
      </el-button>
      <el-button>
        <Icon icon="clarity:contract-line" class="mr-5px" />
        创建合同
      </el-button>
      <el-button>
        <Icon icon="icon-park:income-one" class="mr-5px" />
        创建回款
      </el-button>
      <el-button>
        <Icon icon="fluent:people-team-add-20-filled" class="mr-5px" />
        添加团队成员
      </el-button>
    </el-row>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="客户">
        {{ contact.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="职务">
        {{ contact.post }}
      </el-descriptions-item>
      <el-descriptions-item label="手机">
        {{ contact.mobile }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ contact.createTime ? formatDate(contact.createTime) : '空' }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <!-- TODO wanwan：这个 tab 拉满哈，可以更好看； -->
  <el-col :span="18">
    <el-tabs>
      <el-tab-pane label="基本信息">
        <!-- TODO wanwan：这个 ml-2 是不是可以优化下，不要整个左移，而是里面的内容有个几 px 的偏移，不顶在框里 -->
        <ContactDetails class="ml-2" :contact="contact" />
      </el-tab-pane>
      <el-tab-pane label="跟进记录" lazy> 跟进记录</el-tab-pane>
      <el-tab-pane label="商机" lazy> 商机</el-tab-pane>
      <el-tab-pane label="附件" lazy> 附件</el-tab-pane>
      <!-- TODO wanwan 以下标签上的数量需要接口统计返回 -->
      <el-tab-pane label="操作记录" lazy>
        <template #label> 操作记录<el-badge :value="12" class="item" type="primary" /> </template>
        操作记录
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <ContactForm ref="formRef" @success="getContactData(id)" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ContactApi from '@/api/crm/contact'
import ContactBasicInfo from '@/views/crm/contact/detail/ContactBasicInfo.vue'
import ContactDetails from '@/views/crm/contact/detail/ContactDetails.vue'
import ContactForm from '@/views/crm/contact/ContactForm.vue'
import { formatDate } from '@/utils/formatTime'
// TODO 芋艿：后面在 review 么？

defineOptions({ name: 'CrmContactDetail' })

const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
const { currentRoute } = useRouter() // 路由
const id = Number(route.params.id)
const loading = ref(true) // 加载中
// 联系人详情
const contact = ref<ContactApi.ContactVO>({} as ContactApi.ContactVO)
/**
 * 获取详情
 *
 * @param id
 */
const getContactData = async (id: number) => {
  loading.value = true
  try {
    contact.value = await ContactApi.getContact(id)
  } finally {
    loading.value = false
  }
}

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/**
 * 初始化
 */
onMounted(async () => {
  if (!id) {
    ElMessage.warning('参数错误，联系人不能为空！')
    delView(unref(currentRoute))
    return
  }
  await getContactData(id)
})
</script>
