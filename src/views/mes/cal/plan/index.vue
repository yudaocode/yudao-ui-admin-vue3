<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="85px"
    >
      <el-form-item label="计划编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入计划编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="计划名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入计划名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="轮班方式" prop="shiftType">
        <el-select
          v-model="queryParams.shiftType"
          placeholder="请选择轮班方式"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_SHIFT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_PLAN_STATUS)"
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
          v-hasPermi="['mes:cal-plan:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:cal-plan:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="计划编码" align="center" prop="code" min-width="120" />
      <el-table-column label="计划名称" align="center" prop="name" min-width="150" />
      <el-table-column label="班组类型" align="center" prop="calendarType" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" :value="scope.row.calendarType" />
        </template>
      </el-table-column>
      <el-table-column label="开始日期" align="center" prop="startDate" :formatter="dateFormatter" width="180px" />
      <el-table-column label="结束日期" align="center" prop="endDate" :formatter="dateFormatter" width="180px" />
      <el-table-column label="轮班方式" align="center" prop="shiftType" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_CAL_SHIFT_TYPE" :value="scope.row.shiftType" />
        </template>
      </el-table-column>
      <el-table-column label="倒班方式" align="center" prop="shiftMethod" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_CAL_SHIFT_METHOD" :value="scope.row.shiftMethod" />
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_CAL_PLAN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="150">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:cal-plan:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === MesCalPlanStatusEnum.PREPARE"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:cal-plan:delete']"
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
  <CalPlanForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CalPlanApi, CalPlanVO } from '@/api/mes/cal/plan'
import CalPlanForm from './CalPlanForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesCalPlanStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesCalPlan' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<CalPlanVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  shiftType: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CalPlanApi.getPlanPage(queryParams)
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
    await CalPlanApi.deletePlan(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await CalPlanApi.exportPlan(queryParams)
    download.excel(data, '排班计划.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
