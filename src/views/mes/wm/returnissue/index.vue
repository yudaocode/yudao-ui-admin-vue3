<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="退料单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入退料单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="退料单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入退料单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：增加 生产工单 的 select -->
      <!-- TODO @AI：需要生成下，字典插入 sql -->
      <el-form-item label="退料类型" prop="returnType">
        <el-select
          v-model="queryParams.returnType"
          placeholder="请选择退料类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退料日期" prop="returnDate">
        <el-date-picker
          v-model="queryParams.returnDate"
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
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_STATUS)"
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
          v-hasPermi="['mes:wm-return-issue:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-return-issue:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="退料单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="退料单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="生产工单" align="center" prop="workOrderCode" min-width="140" />
      <el-table-column label="工作站" align="center" prop="workstationName" min-width="120" />
      <el-table-column label="退料类型" align="center" prop="returnType" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column
        label="退料日期"
        align="center"
        prop="returnDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_RETURN_ISSUE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-return-issue:update']"
            v-if="scope.row.status === MesWmReturnIssueStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-return-issue:update']"
            v-if="scope.row.status === MesWmReturnIssueStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-return-issue:delete']"
            v-if="scope.row.status === MesWmReturnIssueStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- TODO @芋艿：UNEXECUTE、UNSTOCK； -->
          <!-- 待入库：入库上架 -->
          <!-- TODO @AI：名字改成：“执行上架” -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-return-issue:update']"
            v-if="scope.row.status === MesWmReturnIssueStatusEnum.APPROVING"
          >
            入库上架
          </el-button>
          <!-- 已入库：完成 -->
          <!-- TODO @AI：名字换成：“执行退料” -->
          <el-button
            link
            type="success"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-return-issue:execute']"
            v-if="scope.row.status === MesWmReturnIssueStatusEnum.APPROVED"
          >
            完成
          </el-button>
          <!-- 待入库、已入库：取消 -->
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-return-issue:update']"
            v-if="
              [MesWmReturnIssueStatusEnum.APPROVING, MesWmReturnIssueStatusEnum.APPROVED].includes(
                scope.row.status
              )
            "
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

  <ReturnIssueForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmReturnIssueApi, WmReturnIssueVO } from '@/api/mes/wm/returnissue'
import ReturnIssueForm from './ReturnIssueForm.vue'
import { MesWmReturnIssueStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmReturnIssue' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmReturnIssueVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  returnType: undefined,
  status: undefined,
  returnDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmReturnIssueApi.getReturnIssuePage(queryParams)
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

/** 提交按钮操作 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该退料单吗？')
    await WmReturnIssueApi.submitReturnIssue(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmReturnIssueApi.deleteReturnIssue(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 取消按钮操作 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该生产退料单？取消后不可恢复。')
    await WmReturnIssueApi.cancelReturnIssue(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 完成按钮操作 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认完成该退料单并执行入库吗？')
    await WmReturnIssueApi.finishReturnIssue(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmReturnIssueApi.exportReturnIssue(queryParams)
    download.excel(data, '生产退料单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>
