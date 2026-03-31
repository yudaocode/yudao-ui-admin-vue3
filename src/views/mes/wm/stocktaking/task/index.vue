<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="100px"
      class="-mb-15px"
    >
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
      <el-form-item label="任务编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入任务编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="盘点日期" prop="takingDate">
        <el-date-picker
          v-model="queryParams.takingDate"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
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
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS)"
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
          v-hasPermi="['mes:wm-stock-taking-task:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-stock-taking-task:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="任务编码" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="任务名称" align="center" prop="name" min-width="160" />
      <el-table-column label="盘点类型" align="center" prop="type" min-width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="盘点方案" align="center" prop="planName" min-width="180" />
      <el-table-column
        label="盘点日期"
        align="center"
        prop="takingDate"
        :formatter="dateFormatter2"
        min-width="180"
      />
      <el-table-column label="盘点人" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="360" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            v-if="scope.row.status === MesWmStockTakingTaskStatusEnum.PREPARE"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-stock-taking-task:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmStockTakingTaskStatusEnum.PREPARE"
            link
            type="success"
            @click="openForm('submit', scope.row.id)"
            v-hasPermi="['mes:wm-stock-taking-task:update']"
          >
            提交
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmStockTakingTaskStatusEnum.PREPARE"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-stock-taking-task:delete']"
          >
            删除
          </el-button>
          <!-- 审批中：执行盘点、取消 -->
          <el-button
            v-if="scope.row.status === MesWmStockTakingTaskStatusEnum.APPROVING"
            link
            type="success"
            @click="openForm('execute', scope.row.id)"
            v-hasPermi="['mes:wm-stock-taking-task:update']"
          >
            执行盘点
          </el-button>
          <el-button
            v-if="scope.row.status === MesWmStockTakingTaskStatusEnum.APPROVING"
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-stock-taking-task:update']"
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

  <StockTakingForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { StockTakingApi, type StockTakingTaskVO } from '@/api/mes/wm/stocktaking/task/index'
import { MesWmStockTakingTaskStatusEnum } from '@/views/mes/utils/constants'
import StockTakingForm from './StockTakingForm.vue'

defineOptions({ name: 'MesWmStockTakingTaking' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<StockTakingTaskVO[]>([]) // 列表数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  status: undefined,
  takingDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单 Ref

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await StockTakingApi.getStockTakingPage(queryParams)
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

/** 取消任务 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该盘点任务？取消后不可恢复。')
    await StockTakingApi.cancelStockTaking(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StockTakingApi.deleteStockTaking(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await StockTakingApi.exportStockTaking(queryParams)
    download.excel(data, '盘点任务.xls')
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
