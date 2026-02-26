<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="领料单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入领料单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="领料单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入领料单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="领料日期" prop="issueDate">
        <el-date-picker
          v-model="queryParams.issueDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：单据状态 -->
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-production-issue:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-production-issue:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <!-- TODO @AI：点击后，跳转详情 -->
      <el-table-column label="领料单编号" align="center" prop="code" min-width="160" />
      <el-table-column label="领料单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="生产工单" align="center" prop="workorderCode" min-width="140" />
      <!-- TODO @AI：工作站、workstationName -->
      <!-- TODO @AI：客户编号、客户名称 -->
      <!-- TODO @AI：需求日期 -->
      <!-- TODO @AI：移除“领料日期” -->
      <el-table-column
        label="领料日期"
        align="center"
        prop="issueDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_ISSUE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- TODO @AI：操作和 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/itemreceipt/index.vue 对齐下； -->
          <!-- TODO @AI：应该是：执行领出、修改、删除； -->
          <!-- 准备中：编辑、审批、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-production-issue:update']"
            v-if="scope.row.status === 10"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="handleApprove(scope.row.id)"
            v-hasPermi="['mes:wm-production-issue:update-status']"
            v-if="scope.row.status === 10"
          >
            审批
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-production-issue:delete']"
            v-if="scope.row.status === 10"
          >
            删除
          </el-button>
          <!-- 已审批：反审批、完成 -->
          <el-button
            link
            type="warning"
            @click="handleUnapprove(scope.row.id)"
            v-hasPermi="['mes:wm-production-issue:update-status']"
            v-if="scope.row.status === 20"
          >
            反审批
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-production-issue:update-status']"
            v-if="scope.row.status === 20"
          >
            完成
          </el-button>
          <el-button link type="info" @click="openForm('detail', scope.row.id)"> 详情 </el-button>
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

  <IssueForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { WmProductionIssueApi, WmProductionIssueVO } from '@/api/mes/wm/production-issue'
import IssueForm from './IssueForm.vue'

defineOptions({ name: 'MesWmIssue' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmProductionIssueVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  issueDate: undefined
})
const queryFormRef = ref()
const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmProductionIssueApi.getIssuePage(queryParams)
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

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmProductionIssueApi.deleteIssue(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 审批按钮操作 */
const handleApprove = async (id: number) => {
  try {
    await message.confirm('确认审批该领料单吗？')
    await WmProductionIssueApi.approveIssue(id)
    message.success('审批成功')
    await getList()
  } catch {}
}

/** 反审批按钮操作 */
const handleUnapprove = async (id: number) => {
  try {
    await message.confirm('确认反审批该领料单吗？')
    await WmProductionIssueApi.unapproveIssue(id)
    message.success('反审批成功')
    await getList()
  } catch {}
}

/** 完成按钮操作 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认完成该领料单吗？')
    await WmProductionIssueApi.finishIssue(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmProductionIssueApi.exportIssue(queryParams)
    download.excel(data, '领料出库单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>
