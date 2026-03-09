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
import { CommonStatusEnum } from '@/utils/constants'
import { StockTakingPlanApi, type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan/index'
import StockTakingPlanForm from './StockTakingPlanForm.vue'

defineOptions({ name: 'MesWmStockTakingPlan' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<StockTakingPlanVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined
})
const queryFormRef = ref() // 搜索的表单

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
const formRef = ref()
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
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await StockTakingPlanApi.deleteStockTakingPlan(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const exportLoading = ref(false)
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
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
