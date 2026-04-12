<!-- MES 生产流转卡列表 -->
<template>
  <doc-alert title="【生产】生产排产、工序流转卡" url="https://doc.iocoder.cn/mes/schedule-card/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="流转卡编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入流转卡编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="生产工单" prop="workOrderId">
        <ProWorkOrderSelect
          v-model="queryParams.workOrderId"
          placeholder="请选择工单"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品" prop="itemId">
        <MdItemSelect v-model="queryParams.itemId" placeholder="请选择产品" class="!w-240px" />
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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:pro-card:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-card:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="流转卡编码" align="center" prop="code" width="140">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="生产工单编号" align="center" prop="workOrderCode" width="140" />
      <el-table-column label="工单名称" align="center" prop="workOrderName" min-width="150" />
      <el-table-column label="批次号" align="center" prop="batchCode" width="120" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="120" />
      <el-table-column label="规格型号" align="center" prop="specification" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="流转数量" align="center" prop="transferedQuantity" width="100" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:pro-card:update']"
            v-if="scope.row.status === MesProCardStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:pro-card:delete']"
            v-if="scope.row.status === MesProCardStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 已确认：执行、取消 -->
          <el-button
            link
            type="success"
            @click="openForm('finish', scope.row.id)"
            v-hasPermi="['mes:pro-card:finish']"
            v-if="scope.row.status === MesProCardStatusEnum.CONFIRMED"
          >
            完成
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:pro-card:update']"
            v-if="scope.row.status === MesProCardStatusEnum.CONFIRMED"
          >
            取消
          </el-button>
          <PrinterLabel :bizId="scope.row.id" :bizCode="scope.row.code" bizType="PROCARD" />
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
  <CardForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { ProCardApi, ProCardVO } from '@/api/mes/pro/card'
import CardForm from './CardForm.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import { MesProCardStatusEnum } from '@/views/mes/utils/constants'
import { PrinterLabel } from '@/views/mes/wm/barcode/components'

defineOptions({ name: 'MesProCard' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ProCardVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  workOrderId: undefined,
  itemId: undefined,
  batchCode: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProCardApi.getCardPage(queryParams)
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
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 取消按钮操作 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该流转卡？取消后不可恢复。')
    await ProCardApi.cancelCard(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProCardApi.deleteCard(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProCardApi.exportCard(queryParams)
    download.excel(data, '生产流转卡.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
