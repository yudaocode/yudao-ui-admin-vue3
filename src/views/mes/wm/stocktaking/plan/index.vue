<template>
  <doc-alert title="【仓库】库存盘点" url="https://doc.iocoder.cn/mes/wm/stocktaking/" />

  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="100px"
      class="-mb-15px"
    >
      <el-form-item label="方案编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入方案编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="方案名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入方案名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="盘点类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择盘点类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-stock-taking-plan:create']"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-stock-taking-plan:export']"
        >
          <Icon icon="ep:download" />导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="方案编码" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="方案名称" align="center" prop="name" min-width="160" />
      <el-table-column label="盘点类型" align="center" prop="type" min-width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="是否盲盘" align="center" prop="blindFlag" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.blindFlag" />
        </template>
      </el-table-column>
      <el-table-column label="是否冻结库存" align="center" prop="frozen" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.frozen" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="120">
        <template #default="scope">
          <el-switch
            :model-value="scope.row.status"
            :active-value="CommonStatusEnum.ENABLE"
            :inactive-value="CommonStatusEnum.DISABLE"
            :disabled="loading"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-tooltip
            :disabled="scope.row.status === CommonStatusEnum.DISABLE"
            content="仅关闭状态，才可以操作"
            placement="top"
          >
            <span class="inline-block cursor-not-allowed">
              <el-button
                link
                type="primary"
                @click="openForm('update', scope.row.id)"
                v-hasPermi="['mes:wm-stock-taking-plan:update']"
                :disabled="scope.row.status !== CommonStatusEnum.DISABLE"
              >
                编辑
              </el-button>
            </span>
          </el-tooltip>
          <el-tooltip
            :disabled="scope.row.status === CommonStatusEnum.DISABLE"
            content="仅关闭状态，才可以操作"
            placement="top"
          >
            <span class="inline-block cursor-not-allowed ml-10px">
              <el-button
                link
                type="danger"
                @click="handleDelete(scope.row.id)"
                v-hasPermi="['mes:wm-stock-taking-plan:delete']"
                :disabled="scope.row.status !== CommonStatusEnum.DISABLE"
              >
                删除
              </el-button>
            </span>
          </el-tooltip>
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

  <!-- 添加或修改盘点方案对话框 -->
  <StockTakingPlanForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CommonStatusEnum } from '@/utils/constants'
import { StockTakingPlanApi, type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan/index'
import StockTakingPlanForm from './StockTakingPlanForm.vue'

defineOptions({ name: 'MesWmStockTakingPlan' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<StockTakingPlanVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await StockTakingPlanApi.getStockTakingPlanPage(queryParams)
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

/** 修改盘点方案状态 */
const handleStatusChange = async (row: StockTakingPlanVO) => {
  try {
    const newStatus =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
    const text = newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
    await message.confirm(`确认要${text}”${row.name}”盘点方案吗？`)
    await StockTakingPlanApi.updateStockTakingPlanStatus(row.id!, newStatus)
    message.success(`${text}成功`)
    await getList()
  } catch {
    await getList()
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StockTakingPlanApi.deleteStockTakingPlan(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await StockTakingPlanApi.exportStockTakingPlan(queryParams)
    download.excel(data, '盘点方案.xls')
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
