<template>
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
      <!-- TODO @AI：前后端都去掉 status 筛选； -->
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：前后端都去掉 enableFlag 筛选； -->
      <el-form-item label="启用状态" prop="enableFlag">
        <el-select
          v-model="queryParams.enableFlag"
          placeholder="请选择启用状态"
          clearable
          class="!w-240px"
        >
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-stocktaking-plan:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-stocktaking-plan:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
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
      <el-table-column label="开始时间" align="center" prop="startTime" min-width="180" />
      <el-table-column label="结束时间" align="center" prop="endTime" min-width="180" />
      <el-table-column label="是否盲盘" align="center" prop="blindFlag" width="100">
        <!-- TODO @AI: booleanstring 数据字典 -->
        <template #default="scope">
          <el-tag :type="scope.row.blindFlag ? 'warning' : 'success'">
            {{ scope.row.blindFlag ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否冻结库存" align="center" prop="frozenFlag" width="100">
        <template #default="scope">
          <!-- TODO @AI: booleanstring 数据字典 -->
          <el-tag :type="scope.row.frozenFlag ? 'warning' : 'info'">
            {{ scope.row.frozenFlag ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- TODO @AI：enableFlag 和 status 融合了 -->
      <el-table-column label="启用" align="center" prop="enableFlag" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.enableFlag ? 'success' : 'info'">
            {{ scope.row.enableFlag ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="340" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === MesWmStockTakingPlanStatusEnum.PREPARE"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-stocktaking-plan:update']"
          >
            编辑
          </el-button>
          <!-- TODO @AI：去掉“确认”操作了； -->
          <el-button
            v-if="scope.row.status === MesWmStockTakingPlanStatusEnum.PREPARE"
            link
            type="warning"
            @click="handleConfirm(scope.row.id)"
            v-hasPermi="['mes:wm-stocktaking-plan:update']"
          >
            确认
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmStockTakingPlanStatusEnum.PREPARE"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-stocktaking-plan:delete']"
          >
            删除
          </el-button>
          <!-- TODO @AI：前后端都去嗲哦这个操作；不需要； -->
          <el-button
            link
            type="success"
            @click="handleGenerate(scope.row)"
            v-hasPermi="['mes:wm-stocktaking-task:create']"
          >
            生成任务
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

  <StockTakingPlanForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import {
  StockTakingPlanApi,
  type StockTakingPlanGenerateReqVO,
  type StockTakingPlanVO
} from '@/api/mes/wm/stocktaking/plan'
import { MesWmStockTakingPlanStatusEnum } from '@/views/mes/utils/constants'
import StockTakingPlanForm from './StockTakingPlanForm.vue'

// TODO @AI：注释参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/index.vue

defineOptions({ name: 'MesWmStockTakingPlan' })

const message = useMessage()
const { t } = useI18n()
const userStore = useUserStore()

const loading = ref(true)
const list = ref<StockTakingPlanVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  status: undefined,
  enableFlag: undefined
})
const queryFormRef = ref()
const formRef = ref()

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

const handleConfirm = async (id: number) => {
  try {
    await message.confirm('确认该盘点方案后将不可再修改关键内容，是否继续？')
    await StockTakingPlanApi.confirmStockTakingPlan(id)
    message.success('确认成功')
    await getList()
  } catch {}
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StockTakingPlanApi.deleteStockTakingPlan(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleGenerate = async (row: StockTakingPlanVO) => {
  try {
    const plan = await StockTakingPlanApi.getStockTakingPlan(row.id!)
    const codeResult = await ElMessageBox.prompt('请输入任务编码', '生成盘点任务', {
      inputValue: `ST${Date.now()}`,
      inputValidator: (value) => !!value || '任务编码不能为空'
    })
    const nameResult = await ElMessageBox.prompt('请输入任务名称', '生成盘点任务', {
      inputValue: `${row.name || row.code}-任务`,
      inputValidator: (value) => !!value || '任务名称不能为空'
    })
    const reqVO: StockTakingPlanGenerateReqVO = {
      planId: row.id!,
      code: codeResult.value,
      name: nameResult.value,
      takingDate: row.startTime,
      userId: userStore.getUser.id,
      remark: row.remark,
      params: plan.params
    }
    await StockTakingPlanApi.generateStockTakingTask(reqVO)
    message.success('生成任务成功')
  } catch {}
}

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

onMounted(() => {
  getList()
})
</script>
