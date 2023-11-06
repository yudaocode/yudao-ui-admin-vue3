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
      <el-form-item label="回款编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入回款编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <!--<el-form-item label="回款计划ID" prop="planId">
        <el-input
          v-model="queryParams.planId"
          placeholder="请输入回款计划ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>-->
      <el-form-item label="客户名称" prop="customerId">
        <el-input
          v-model="queryParams.customerId"
          placeholder="请输入客户名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="合同名称" prop="contractId">
        <el-input
          v-model="queryParams.contractId"
          placeholder="请输入合同名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="审批状态" prop="checkStatus">
        <el-select
          v-model="queryParams.checkStatus"
          placeholder="请选择审批状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_RECEIVABLE_CHECK_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!--<el-form-item label="工作流编号" prop="processInstanceId">
        <el-input
          v-model="queryParams.processInstanceId"
          placeholder="请输入工作流编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>-->
      <el-form-item label="回款日期" prop="returnTime">
        <el-date-picker
          v-model="queryParams.returnTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="回款方式" prop="returnType">
        <el-select
          v-model="queryParams.returnType"
          placeholder="请选择回款方式"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_RETURN_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!--<el-form-item label="回款金额" prop="price">
        <el-input
          v-model="queryParams.price"
          placeholder="请输入回款金额"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>-->
      <!--<el-form-item label="负责人" prop="ownerUserId">
        <el-input
          v-model="queryParams.ownerUserId"
          placeholder="请输入负责人"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="批次" prop="batchId">
        <el-input
          v-model="queryParams.batchId"
          placeholder="请输入批次"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>-->
      <!--<el-form-item label="数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）" prop="dataScope">
        <el-input
          v-model="queryParams.dataScope"
          placeholder="请输入数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="数据范围(指定部门数组)" prop="dataScopeDeptIds">
        <el-input
          v-model="queryParams.dataScopeDeptIds"
          placeholder="请输入数据范围(指定部门数组)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>-->
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['crm:receivable:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['crm:receivable:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="ID" align="center" prop="id" />
      <el-table-column label="回款编号" align="center" prop="no" />
      <!-- <el-table-column label="回款计划ID" align="center" prop="planId" />-->
      <el-table-column label="客户" align="center" prop="customerId" />
      <el-table-column label="合同" align="center" prop="contractId" />
      <el-table-column label="审批状态" align="center" prop="checkStatus" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RECEIVABLE_CHECK_STATUS" :value="scope.row.checkStatus" />
        </template>
      </el-table-column>
      <!-- <el-table-column label="工作流编号" align="center" prop="processInstanceId" />-->
      <el-table-column
        label="回款日期"
        align="center"
        prop="returnTime"
        :formatter="dateFormatter2"
        width="150px"
      />
      <el-table-column label="回款方式" align="center" prop="returnType" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RETURN_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column label="回款金额(元)" align="center" prop="price" />
      <el-table-column label="负责人" align="center" prop="ownerUserId" />
      <el-table-column label="批次" align="center" prop="batchId" />
      <!--<el-table-column label="显示顺序" align="center" prop="sort" />-->
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180px">
        <template #default="scope">
          <!-- todo @liuhongfeng：用路径参数哈，receivableId -->
          <!--<router-link :to="'/crm/receivable-plan?receivableId=' + scope.row.receivableId">
            <el-button link type="primary">详情</el-button>
          </router-link>-->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['crm:receivable:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['crm:receivable:delete']"
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
  <ReceivableForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import * as ReceivableApi from '@/api/crm/receivable'
import ReceivableForm from './ReceivableForm.vue'

defineOptions({ name: 'Receivable' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: null,
  planId: null,
  customerId: null,
  contractId: null,
  checkStatus: null,
  processInstanceId: null,
  returnTime: [],
  returnType: null,
  price: null,
  ownerUserId: null,
  batchId: null,
  sort: null,
  dataScope: null,
  dataScopeDeptIds: null,
  status: null,
  remark: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReceivableApi.getReceivablePage(queryParams)
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
    await ReceivableApi.deleteReceivable(id)
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
    const data = await ReceivableApi.exportReceivable(queryParams)
    download.excel(data, '回款管理.xls')
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
