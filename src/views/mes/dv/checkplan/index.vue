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
      <el-form-item label="方案类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择方案类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @芋艿：【后续在看】草稿、已确认、审批中、已审批、已完成、已取消； -->
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_CHECK_PLAN_STATUS)"
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
          v-hasPermi="['mes:dv-check-plan:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:dv-check-plan:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="方案编码" align="center" prop="code" min-width="120" />
      <el-table-column label="方案名称" align="center" prop="name" min-width="150" />
      <el-table-column label="方案类型" align="center" prop="type" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="周期数量" align="center" prop="cycleCount" min-width="80" />
      <el-table-column label="周期类型" align="center" prop="cycleType" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_CYCLE_TYPE" :value="scope.row.cycleType" />
        </template>
      </el-table-column>
      <el-table-column
        label="开始日期"
        align="center"
        prop="startDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column
        label="结束日期"
        align="center"
        prop="endDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <!-- TODO @AI：查看，挪到【方案编码】点击打开；并且不用判断状态； -->
          <el-button
            v-if="scope.row.status !== MesDvCheckPlanStatusEnum.PREPARE"
            link
            type="primary"
            @click="openForm('detail', scope.row.id)"
            v-hasPermi="['mes:dv-check-plan:query']"
          >
            查看
          </el-button>
          <el-button
            v-if="scope.row.status === MesDvCheckPlanStatusEnum.PREPARE"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:dv-check-plan:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === MesDvCheckPlanStatusEnum.PREPARE"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:dv-check-plan:delete']"
          >
            删除
          </el-button>
          <el-button
            v-if="scope.row.status === MesDvCheckPlanStatusEnum.PREPARE"
            link
            type="success"
            @click="handleEnable(scope.row.id)"
            v-hasPermi="['mes:dv-check-plan:update']"
          >
            启用
          </el-button>
          <el-button
            v-if="scope.row.status === MesDvCheckPlanStatusEnum.ENABLED"
            link
            type="warning"
            @click="handleDisable(scope.row.id)"
            v-hasPermi="['mes:dv-check-plan:update']"
          >
            停用
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
  <CheckPlanForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import { DvCheckPlanApi, DvCheckPlanVO } from '@/api/mes/dv/checkplan'
import CheckPlanForm from './CheckPlanForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesDvCheckPlanStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesDvCheckPlan' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<DvCheckPlanVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvCheckPlanApi.getCheckPlanPage(queryParams)
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
    await DvCheckPlanApi.deleteCheckPlan(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 启用按钮操作 */
const handleEnable = async (id: number) => {
  try {
    await message.confirm('确认启用该点检保养方案？启用后将不可修改或删除。')
    await DvCheckPlanApi.enableCheckPlan(id)
    message.success('启用成功')
    await getList()
  } catch {}
}

/** 停用按钮操作 */
const handleDisable = async (id: number) => {
  try {
    await message.confirm('确认停用该点检保养方案？')
    await DvCheckPlanApi.disableCheckPlan(id)
    message.success('停用成功')
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DvCheckPlanApi.exportCheckPlan(queryParams)
    download.excel(data, '点检保养方案.xls')
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
