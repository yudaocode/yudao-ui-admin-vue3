<!-- MES 来料检验单（IQC）列表 -->
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
      <el-form-item label="供应商" prop="vendorId">
        <MdVendorSelect
          v-model="queryParams.vendorId"
          placeholder="请选择供应商"
          clearable
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应商批次" prop="vendorBatch">
        <el-input
          v-model="queryParams.vendorBatch"
          placeholder="请输入供应商批次号"
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
      <!-- TODO @AI：检测结论 -->
      <!-- TODO @AI：字典，只需要：校验通过、校验不通过 -->
      <el-form-item label="检测结果" prop="checkResult">
        <el-select
          v-model="queryParams.checkResult"
          placeholder="请选择检测结果"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：单据状态，去掉 -->
      <el-form-item label="单据状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_IQC_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来料日期" prop="receiveDate">
        <el-date-picker
          v-model="queryParams.receiveDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="检测日期" prop="inspectDate">
        <el-date-picker
          v-model="queryParams.inspectDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：检测人员，下拉选择 -->
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:qc-iqc:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:qc-iqc:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <!-- TODO @AI：来料检验单编号、来料检验单名称 -->
      <el-table-column label="检验单编号" align="center" prop="code" width="160" />
      <el-table-column label="检验单名称" align="center" prop="name" min-width="180" />
      <el-table-column label="供应商简称" align="center" prop="vendorNickname" width="120" />
      <el-table-column label="供应商批次号" align="center" prop="vendorBatch" width="130" />
      <!-- TODO @AI：产品物料编码、产品物料名称 -->
      <el-table-column label="物料编码" align="center" prop="itemCode" width="130" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="接收数量" align="center" prop="receivedQuantity" width="100" />
      <el-table-column label="检测数量" align="center" prop="checkQuantity" width="100" />
      <el-table-column label="不合格数" align="center" prop="unqualifiedQuantity" width="100" />
      <el-table-column label="检测结果" align="center" prop="checkResult" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_QC_CHECK_RESULT" :value="scope.row.checkResult" />
        </template>
      </el-table-column>
      <el-table-column
        label="来料日期"
        align="center"
        prop="receiveDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column
        label="检测日期"
        align="center"
        prop="inspectDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="检测人员" align="center" prop="inspector" width="100" />
      <el-table-column label="单据状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_QC_IQC_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <!-- TODO @AI：完成；是否完成来料检验单编制？【完成后将不能更改】 -->
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-iqc:update']"
            v-if="scope.row.status === 0"
          >
            编辑
          </el-button>
          <!-- TODO @AI：status 枚举值； -->
          <!-- TODO @芋艿：查看报表，后续要搞下； -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-if="scope.row.status !== 0"
          >
            查看报表
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-iqc:delete']"
            v-if="scope.row.status === 0"
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
  <IqcForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcIqcApi, QcIqcVO } from '@/api/mes/qc/iqc'
import IqcForm from './IqcForm.vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'MesQcIqc' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<QcIqcVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  vendorId: undefined,
  vendorBatch: undefined,
  itemId: undefined,
  checkResult: undefined,
  status: undefined,
  receiveDate: undefined,
  inspectDate: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcIqcApi.getIqcPage(queryParams)
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
    await QcIqcApi.deleteIqc(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await QcIqcApi.exportIqc(queryParams)
    download.excel(data, '来料检验单.xls')
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
