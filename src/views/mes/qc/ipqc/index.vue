<!-- MES 过程检验单（IPQC）列表 -->
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
      <el-form-item label="检验类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择检验类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_IPQC_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="生产工单" prop="workOrderId">
        <ProWorkOrderSelect
          v-model="queryParams.workOrderId"
          placeholder="请选择生产工单"
          clearable
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="工位" prop="workstationId">
        <MdWorkstationSelect
          v-model="queryParams.workstationId"
          placeholder="请选择工位"
          clearable
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
      <el-form-item label="检测结论" prop="checkResult">
        <el-select
          v-model="queryParams.checkResult"
          placeholder="请选择检测结论"
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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:qc-ipqc:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:qc-ipqc:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="检验单编号" align="center" prop="code" width="160" />
      <el-table-column label="检验单名称" align="center" prop="name" min-width="180" />
      <el-table-column label="检验类型" align="center" prop="type" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_IPQC_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="工单编号" align="center" prop="workOrderCode" width="140" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" width="130" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpecification" width="130" />
      <el-table-column label="单位" align="center" prop="unitName" width="80" />
      <el-table-column label="检测数量" align="center" prop="checkQuantity" width="100" />
      <el-table-column label="检测结论" align="center" prop="checkResult" width="100">
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
      <el-table-column label="单据状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_QC_IQC_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-ipqc:update']"
            v-if="scope.row.status === MesQcIpqcStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="handleComplete(scope.row.id)"
            v-hasPermi="['mes:qc-ipqc:update']"
            v-if="scope.row.status === MesQcIpqcStatusEnum.PREPARE"
          >
            完成
          </el-button>
          <!-- TODO @芋艿：查看报表，后续要搞下； -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-if="scope.row.status !== MesQcIpqcStatusEnum.PREPARE"
          >
            查看报表
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-ipqc:delete']"
            v-if="scope.row.status === MesQcIpqcStatusEnum.PREPARE"
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
  <IpqcForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcIpqcApi, QcIpqcVO } from '@/api/mes/qc/ipqc'
import IpqcForm from './IpqcForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import { MesQcIpqcStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesQcIpqc' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<QcIpqcVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  type: undefined,
  workOrderId: undefined,
  workstationId: undefined,
  itemId: undefined,
  checkResult: undefined,
  inspectDate: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcIpqcApi.getIpqcPage(queryParams)
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

/** 完成操作 */
const handleComplete = async (id: number) => {
  try {
    await message.confirm('是否完成过程检验单编制？【完成后将不能更改】')
    await QcIpqcApi.completeIpqc(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await QcIpqcApi.deleteIpqc(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await QcIpqcApi.exportIpqc(queryParams)
    download.excel(data, '过程检验单.xls')
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
