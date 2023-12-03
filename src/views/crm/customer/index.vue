<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="客户名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入客户名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          class="!w-240px"
          clearable
          placeholder="请输入手机"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属行业" prop="industryId">
        <el-select
          v-model="queryParams.industryId"
          class="!w-240px"
          clearable
          placeholder="请选择所属行业"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="客户等级" prop="level">
        <el-select
          v-model="queryParams.level"
          class="!w-240px"
          clearable
          placeholder="请选择客户等级"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="客户来源" prop="source">
        <el-select
          v-model="queryParams.source"
          class="!w-240px"
          clearable
          placeholder="请选择客户来源"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"> <Icon class="mr-5px" icon="ep:search" /> 搜索 </el-button>
        <el-button @click="resetQuery"> <Icon class="mr-5px" icon="ep:refresh" />重置 </el-button>
        <el-button v-hasPermi="['crm:customer:create']" type="primary" @click="openForm('create')">
          <Icon class="mr-5px" icon="ep:plus" /> 新增
        </el-button>
        <el-button
          v-hasPermi="['crm:customer:export']"
          :loading="exportLoading"
          plain
          type="success"
          @click="handleExport"
        >
          <Icon class="mr-5px" icon="ep:download" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="编号" prop="id" />
      <el-table-column align="center" label="客户名称" prop="name" width="160">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="所属行业" prop="industryId" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="scope.row.industryId" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户来源" prop="source" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="scope.row.source" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户等级" prop="level" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="scope.row.level" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="手机" prop="mobile" width="120" />
      <el-table-column align="center" label="详细地址" prop="detailAddress" width="200" />
      <el-table-column align="center" label="负责人" prop="ownerUserName" />
      <el-table-column align="center" label="所属部门" prop="ownerUserDeptName" />
      <el-table-column align="center" label="创建人" prop="creatorName" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" label="成交状态" prop="dealStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.dealStatus" />
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="下次联系时间"
        prop="contactNextTime"
        width="180px"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="最后跟进时间"
        prop="contactLastTime"
        width="180px"
      />
      <el-table-column align="center" label="锁定状态" prop="lockStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.lockStatus" />
        </template>
      </el-table-column>
      <!--  TODO @wanwan 距进入公海天数    -->
      <el-table-column align="center" fixed="right" label="操作" min-width="150">
        <template #default="scope">
          <el-button
            v-hasPermi="['crm:customer:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['crm:customer:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
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

  <!-- 表单弹窗：添加/修改 -->
  <CustomerForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as CustomerApi from '@/api/crm/customer'
import CustomerForm from './CustomerForm.vue'

defineOptions({ name: 'CrmCustomer' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  pool: false,
  name: '',
  mobile: '',
  industryId: undefined,
  level: undefined,
  source: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CustomerApi.getCustomerPage(queryParams)
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
  queryParams.pool = false
  handleQuery()
}

/** 打开客户详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
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
    await CustomerApi.deleteCustomer(id)
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
    const data = await CustomerApi.exportCustomer(queryParams)
    download.excel(data, '客户.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
