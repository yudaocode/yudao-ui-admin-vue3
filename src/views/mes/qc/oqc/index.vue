<!-- MES 出货检验单（OQC）列表 -->
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
      <el-form-item label="客户" prop="clientId">
        <MdClientSelect
          v-model="queryParams.clientId"
          placeholder="请选择客户"
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
      <el-form-item label="出货日期" prop="outDate">
        <el-date-picker
          v-model="queryParams.outDate"
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
          v-hasPermi="['mes:qc-oqc:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:qc-oqc:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="出货检验单编号" align="center" prop="code" width="160" />
      <el-table-column label="出货检验单名称" align="center" prop="name" min-width="180" />
      <el-table-column label="客户简称" align="center" prop="clientNickname" width="120" />
      <el-table-column label="批次号" align="center" prop="batchCode" width="130" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" width="130" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="150" />
      <!-- TODO @AI：出货数量，改成发货数量-->
      <el-table-column label="出货数量" align="center" prop="outQuantity" width="100" />
      <el-table-column label="检测数量" align="center" prop="checkQuantity" width="100" />
      <el-table-column label="不合格数" align="center" prop="unqualifiedQuantity" width="100" />
      <el-table-column label="检测结论" align="center" prop="checkResult" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_QC_CHECK_RESULT" :value="scope.row.checkResult" />
        </template>
      </el-table-column>
      <!-- TODO @AI：出货日期，改成发货日期-->
      <el-table-column
        label="出货日期"
        align="center"
        prop="outDate"
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
            v-hasPermi="['mes:qc-oqc:update']"
            v-if="scope.row.status === MesQcOqcStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="handleComplete(scope.row.id)"
            v-hasPermi="['mes:qc-oqc:update']"
            v-if="scope.row.status === MesQcOqcStatusEnum.PREPARE"
          >
            完成
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-if="scope.row.status !== MesQcOqcStatusEnum.PREPARE"
          >
            查看报表
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-oqc:delete']"
            v-if="scope.row.status === MesQcOqcStatusEnum.PREPARE"
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
  <OqcForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcOqcApi, QcOqcVO } from '@/api/mes/qc/oqc'
import OqcForm from './OqcForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { MesQcOqcStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesQcOqc' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<QcOqcVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  clientId: undefined,
  batchCode: undefined,
  itemId: undefined,
  checkResult: undefined,
  outDate: undefined,
  inspectDate: undefined,
  inspectorUserId: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcOqcApi.getOqcPage(queryParams)
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
    await message.confirm('是否完成出货检验单编制？【完成后将不能更改】')
    await QcOqcApi.completeOqc(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await QcOqcApi.deleteOqc(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await QcOqcApi.exportOqc(queryParams)
    download.excel(data, '出货检验单.xls')
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
