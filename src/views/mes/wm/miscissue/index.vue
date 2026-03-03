<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="出库单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入出库单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="出库单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入出库单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：杂项类型，改成“业务类型”； -->
      <el-form-item label="杂项类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择杂项类型"
          clearable
          class="!w-240px"
        >
          <!-- TODO @AI：字典枚举；MES_WM_MISC_ISSUE_TYPE：库存调整、报销出库 -->
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_MISC_ISSUE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @芋艿：【来源单据编号】【来源单据类型】；不用改 -->
      <el-form-item label="出库日期" prop="issueDate">
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
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <!-- TODO @AI：字典枚举；MES_WM_MISC_ISSUE_STATUS：草稿、待执行出库、已完成、已取消； -->
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_MISC_ISSUE_STATUS)"
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
          v-hasPermi="['mes:wm-misc-issue:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-misc-issue:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="出库单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="出库单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="业务类型" align="center" prop="type" min-width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MISC_ISSUE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <!-- TODO @芋艿：【来源单据编号】【来源单据类型】；不用改 -->
      <el-table-column
        label="出库日期"
        align="center"
        prop="issueDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MISC_ISSUE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-misc-issue:update']"
            v-if="scope.row.status === MesWmMiscIssueStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-misc-issue:update']"
            v-if="scope.row.status === MesWmMiscIssueStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-misc-issue:delete']"
            v-if="scope.row.status === MesWmMiscIssueStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待执行出库：执行出库、取消 -->
          <el-button
            link
            type="success"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-misc-issue:finish']"
            v-if="scope.row.status === MesWmMiscIssueStatusEnum.APPROVED"
          >
            执行出库
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-misc-issue:update']"
            v-if="scope.row.status === MesWmMiscIssueStatusEnum.APPROVED"
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

  <MiscIssueForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmMiscIssueApi, WmMiscIssueVO } from '@/api/mes/wm/miscissue'
import MiscIssueForm from './MiscIssueForm.vue'
import { MesWmMiscIssueStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmMiscIssue' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmMiscIssueVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  issueDate: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmMiscIssueApi.getMiscIssuePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增/修改/详情 */
const formRef = ref() // 表单弹窗
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 提交 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该杂项出库单？')
    await WmMiscIssueApi.submitMiscIssue(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 执行出库 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认执行出库？执行后将更新库存台账。')
    await WmMiscIssueApi.finishMiscIssue(id)
    message.success('出库成功')
    await getList()
  } catch {}
}

/** 取消 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该杂项出库单？取消后不可恢复。')
    await WmMiscIssueApi.cancelMiscIssue(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmMiscIssueApi.deleteMiscIssue(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmMiscIssueApi.exportMiscIssue(queryParams)
    download.excel(data, '杂项出库单.xls')
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
