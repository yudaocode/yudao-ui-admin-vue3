<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="客户" prop="customerId">
        <el-select
          v-model="queryParams.customerId"
          placeholder="请选择客户"
          value-key="id"
          lable-key="name"
          @keyup.enter="handleQuery"
          clearable
        >
          <el-option
            v-for="item in customerList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入姓名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          placeholder="请输入手机号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="座机" prop="telephone">
        <el-input
          v-model="queryParams.telephone"
          placeholder="请输入电话"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>

      <el-form-item label="QQ" prop="qq">
        <el-input
          v-model="queryParams.qq"
          placeholder="请输入QQ"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="微信" prop="wechat">
        <el-input
          v-model="queryParams.wechat"
          placeholder="请输入微信"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="电子邮箱" prop="email">
        <el-input
          v-model="queryParams.email"
          placeholder="请输入电子邮箱"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"> <Icon icon="ep:search" class="mr-5px" /> 搜索 </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" /> 重置 </el-button>
        <el-button type="primary" @click="openForm('create')" v-hasPermi="['crm:contact:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['crm:contact:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="姓名" fixed="left" align="center" prop="name">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="客户" fixed="left" align="center" prop="customerName" />
      <el-table-column label="性别" align="center" prop="sex">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="scope.row.sex" />
        </template>
      </el-table-column>
      <el-table-column label="职位" align="center" prop="post" />
      <el-table-column label="是否关键决策人" align="center" prop="master">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.master" />
        </template>
      </el-table-column>
      <el-table-column label="直属上级" align="center" prop="parentName" />
      <el-table-column label="手机号" align="center" prop="mobile" />
      <el-table-column label="座机" align="center" prop="telephone" />
      <el-table-column label="QQ" align="center" prop="qq" />
      <el-table-column label="微信" align="center" prop="wechat" />
      <el-table-column label="邮箱" align="center" prop="email" />
      <el-table-column label="地址" align="center" prop="address" />
      <el-table-column
        label="下次联系时间"
        align="center"
        prop="nextTime"
        width="180px"
        :formatter="dateFormatter"
      />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="最后跟进时间"
        align="center"
        prop="lastTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="负责人" align="center" prop="ownerUserId">
        <template #default="scope">
          {{ scope.row.ownerUserName }}
        </template>
      </el-table-column>
      <!-- <el-table-column label="所属部门" align="center" prop="ownerUserId" /> -->
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <!-- <el-table-column
        label="创建人"
        align="center"
        prop="creator"
        :formatter="dateFormatter"
        width="180px"
      >
        <template #default="scope">
          {{ userList.find((user) => user.id === scope.row.creator)?.nickname }}
        </template>
      </el-table-column> -->
      <el-table-column label="操作" align="center" fixed="right" width="200">
        <template #default="scope">
          <el-button
            plain
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['crm:contact:update']"
          >
            编辑
          </el-button>
          <el-button
            plain
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['crm:contact:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ContactForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as ContactApi from '@/api/crm/contact'
import ContactForm from './ContactForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'

defineOptions({ name: 'CrmContact' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const customerList = ref<CustomerApi.CustomerVO[]>([]) // 客户列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  nextTime: [],
  mobile: null,
  telephone: null,
  email: null,
  customerId: null,
  address: null,
  remark: null,
  ownerUserId: null,
  createTime: [],
  lastTime: [],
  parentId: null,
  name: null,
  post: null,
  qq: null,
  wechat: null,
  sex: null,
  policyMakers: null
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ContactApi.getContactPage(queryParams)
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

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ContactApi.deleteContact(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ContactApi.exportContact(queryParams)
    download.excel(data, '联系人.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 打开客户详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  customerList.value = await CustomerApi.queryAllList()
})
</script>
