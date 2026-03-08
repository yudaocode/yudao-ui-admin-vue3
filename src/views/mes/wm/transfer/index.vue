<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="100px"
      class="-mb-15px"
    >
      <el-form-item label="转移单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入转移单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="转移单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入转移单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="转移单类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择转移单类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_TRANSFER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：前后端，都去掉 转移日期、单据状态的筛选项； -->
      <el-form-item label="转移日期" prop="transferDate">
        <el-date-picker
          v-model="queryParams.transferDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_TRANSFER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-transfer:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-transfer:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="转移单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="转移单名称" align="center" prop="name" min-width="160" />
      <el-table-column label="转移单类型" align="center" prop="type" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_TRANSFER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="是否配送" align="center" prop="deliveryFlag" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.deliveryFlag ? 'success' : 'info'">
            {{ scope.row.deliveryFlag ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="转移日期"
        align="center"
        prop="transferDate"
        :formatter="dateFormatter2"
        width="180"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_TRANSFER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="280" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === MesWmTransferStatusEnum.PREPARE"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-transfer:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmTransferStatusEnum.PREPARE"
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-transfer:update']"
          >
            提交
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmTransferStatusEnum.PREPARE"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-transfer:delete']"
          >
            删除
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmTransferStatusEnum.UNCONFIRMED"
            link
            type="success"
            @click="handleConfirm(scope.row.id)"
            v-hasPermi="['mes:wm-transfer:update']"
          >
            到货确认
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmTransferStatusEnum.UNSTOCK"
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-transfer:update']"
          >
            执行上架
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmTransferStatusEnum.UNEXECUTE"
            link
            type="primary"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-transfer:finish']"
          >
            执行转移
          </el-button>
          <el-button
            v-if="canCancel(scope.row.status)"
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-transfer:update']"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <TransferForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmTransferApi, WmTransferVO } from '@/api/mes/wm/transfer'
import { MesWmTransferStatusEnum } from '@/views/mes/utils/constants'
import TransferForm from './TransferForm.vue'

// TODO @AI：参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/index.vue 的注释风格；

defineOptions({ name: 'MesWmTransfer' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmTransferVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  transferDate: undefined,
  status: undefined
})
const queryFormRef = ref()
const formRef = ref()

// DONE @AI：保留为脚本方法，便于复用取消状态判断
// TODO @AI：还是参考别的模块，保持代码风格的统一；
const canCancel = (status: number) => {
  return [
    MesWmTransferStatusEnum.UNCONFIRMED,
    MesWmTransferStatusEnum.UNSTOCK,
    MesWmTransferStatusEnum.UNEXECUTE
  ].includes(status)
}

const getList = async () => {
  loading.value = true
  try {
    const data = await WmTransferApi.getTransferPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该转移单？')
    await WmTransferApi.submitTransfer(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

const handleConfirm = async (id: number) => {
  try {
    await message.confirm('确认到货后，将进入待上架状态，是否继续？')
    await WmTransferApi.confirmTransfer(id)
    message.success('确认成功')
    await getList()
  } catch {}
}

const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认执行调拨？执行后将更新库存。')
    await WmTransferApi.finishTransfer(id)
    message.success('执行成功')
    await getList()
  } catch {}
}

const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该转移单？取消后不可恢复。')
    await WmTransferApi.cancelTransfer(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmTransferApi.deleteTransfer(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmTransferApi.exportTransfer(queryParams)
    download.excel(data, '转移单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>
