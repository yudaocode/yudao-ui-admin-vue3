<template>
  <div v-loading="loading">
    <div class="flex items-start justify-between">
      <div>
        <!-- 左上：客户基本信息 -->
        <CustomerBasicInfo :customer="customer" />
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button @click="openForm('update', customer.id)" v-hasPermi="['crm:customer:update']">
          编辑
        </el-button>
        <el-button>更改成交状态</el-button>
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
      <el-descriptions-item label="客户级别">
        <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="customer.level" />
      </el-descriptions-item>
      <el-descriptions-item label="成交状态">
        {{ customer.dealStatus ? '已成交' : '未成交' }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">
        {{ customer.ownerUserName }}
      </el-descriptions-item>
      <!-- TODO wanwan 首要联系人? -->
      <el-descriptions-item label="首要联系人" />
      <!-- TODO wanwan 首要联系人电话? -->
      <el-descriptions-item label="首要联系人电话">
        {{ customer.mobile }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <!-- TODO wanwan：这个 tab 拉满哈，可以更好看； -->
  <el-col :span="18">
    <el-tabs>
      <el-tab-pane label="详细资料">
        <!-- TODO wanwan：这个 ml-2 是不是可以优化下，不要整个左移，而是里面的内容有个几 px 的偏移，不顶在框里 -->
        <CustomerDetails class="ml-2" :customer="customer" />
      </el-tab-pane>
      <el-tab-pane label="活动" lazy> 活动</el-tab-pane>
      <el-tab-pane label="邮件" lazy> 邮件</el-tab-pane>
      <el-tab-pane label="工商信息" lazy> 工商信息</el-tab-pane>
      <el-tab-pane label="客户关系" lazy> 客户关系</el-tab-pane>
      <!-- TODO wanwan 以下标签上的数量需要接口统计返回 -->
      <el-tab-pane label="联系人" lazy>
        <template #label> 联系人<el-badge :value="12" class="item" type="primary" /> </template>
        联系人
      </el-tab-pane>
      <el-tab-pane label="团队成员" lazy>
        <template #label> 团队成员<el-badge :value="2" class="item" type="primary" /> </template>
        团队成员
      </el-tab-pane>
      <el-tab-pane label="商机" lazy> 商机</el-tab-pane>
      <el-tab-pane label="合同" lazy>
        <template #label> 合同<el-badge :value="3" class="item" type="primary" /> </template>
        合同
      </el-tab-pane>
      <el-tab-pane label="回款" lazy>
        <template #label> 回款<el-badge :value="4" class="item" type="primary" /> </template>
        回款
      </el-tab-pane>
      <el-tab-pane label="回访" lazy> 回访</el-tab-pane>
      <el-tab-pane label="发票" lazy> 发票</el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <CustomerForm ref="formRef" @success="getCustomerData(id)" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as CustomerApi from '@/api/crm/customer'
import CustomerBasicInfo from '@/views/crm/customer/detail/CustomerBasicInfo.vue'
import { DICT_TYPE } from '@/utils/dict'
import CustomerDetails from '@/views/crm/customer/detail/CustomerDetails.vue'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'

defineOptions({ name: 'CustomerDetail' })

const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
const { currentRoute } = useRouter() // 路由
const id = Number(route.params.id)
const loading = ref(true) // 加载中

// 客户详情
const customer = ref<CustomerApi.CustomerVO>({} as CustomerApi.CustomerVO)

/**
 * 获取详情
 *
 * @param id
 */
const getCustomerData = async (id: number) => {
  loading.value = true
  try {
    customer.value = await CustomerApi.getCustomer(id)
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
onMounted(() => {
  if (!id) {
    ElMessage.warning('参数错误，客户不能为空！')
    delView(unref(currentRoute))
    return
  }
  getCustomerData(id)
})
</script>
