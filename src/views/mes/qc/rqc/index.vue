<!-- MES 退货检验单（RQC）列表 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="检验单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入检验单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <!-- DONE @AI：应该字典处理下：来源单据类型 -->
      <el-form-item label="来源单据类型" prop="sourceDocType">
        <el-select
          v-model="queryParams.sourceDocType"
          placeholder="请选择来源单据类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE).filter((dict) =>
              [MesQcSourceDocTypeEnum.RETURN_ISSUE, MesQcSourceDocTypeEnum.RETURN_SALES].includes(
                dict.value
              )
            )"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源单据编号" prop="sourceDocCode">
        <el-input
          v-model="queryParams.sourceDocCode"
          placeholder="请输入来源单据编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品物料" prop="itemId">
        <MdItemSelect
          v-model="queryParams.itemId"
          placeholder="请选择产品物料"
          clearable
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="批次号" prop="batchCode">
        <el-input
          v-model="queryParams.batchCode"
          placeholder="请输入批次号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="检测结果" prop="checkResult">
        <el-select
          v-model="queryParams.checkResult"
          placeholder="请选择检测结果"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="检测人员" prop="inspectorUserId">
        <UserSelect
          v-model="queryParams.inspectorUserId"
          placeholder="请选择检测人员"
          clearable
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
          v-hasPermi="['mes:qc-rqc:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:qc-rqc:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="检验单编号" align="center" prop="code" width="160">
        <template #default="scope">
          <el-link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="检验单名称" align="center" prop="name" min-width="180" />
      <!-- DONE @AI：应该字典处理下：来源单据类型 -->
      <el-table-column label="来源单据类型" align="center" prop="sourceDocType" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="scope.row.sourceDocType" />
        </template>
      </el-table-column>
      <!-- DONE @AI：来源单据编码，后端 RespVO 已拼接返回 sourceDocCode -->
      <el-table-column label="来源单据编码" align="center" prop="sourceDocCode" width="160" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" width="130" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpecification" width="130" />
      <el-table-column label="单位" align="center" prop="unitName" width="80" />
      <el-table-column label="批次号" align="center" prop="batchCode" width="130" />
      <el-table-column label="检测结果" align="center" prop="checkResult" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_QC_CHECK_RESULT" :value="scope.row.checkResult" />
        </template>
      </el-table-column>
      <el-table-column
        label="检测日期"
        align="center"
        prop="inspectDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="检测人员" align="center" prop="inspectorNickname" width="100" />
      <el-table-column label="单据状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-rqc:update']"
            v-if="scope.row.status === MesQcStatusEnum.DRAFT"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-rqc:delete']"
            v-if="scope.row.status === MesQcStatusEnum.DRAFT"
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
  <RqcForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcRqcApi, QcRqcVO } from '@/api/mes/qc/rqc'
import RqcForm from './RqcForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { MesQcStatusEnum, MesQcSourceDocTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesQcRqc' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<QcRqcVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  itemId: undefined,
  batchCode: undefined,
  checkResult: undefined,
  inspectorUserId: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcRqcApi.getRqcPage(queryParams)
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
    await message.delConfirm()
    await QcRqcApi.deleteRqc(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await QcRqcApi.exportRqc(queryParams)
    download.excel(data, '退货检验单.xls')
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
