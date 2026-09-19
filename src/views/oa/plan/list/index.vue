<template>
  <doc-alert
    title="【协作】日程、任务、计划与汇报"
    url="https://doc.iocoder.cn/oa/collaboration/work/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="计划标题" prop="title">
        <el-input
          v-model="queryParams.title"
          clearable
          class="!w-240px"
          placeholder="请输入计划标题"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="计划标签" prop="label">
        <el-input
          v-model="queryParams.label"
          clearable
          class="!w-240px"
          placeholder="请输入计划标签"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="计划类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择计划类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_PLAN_TYPE)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="计划状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择计划状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_PLAN_STATUS)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发布时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button type="primary" plain v-hasPermi="['oa:plan:create']" @click="openForm('create')">
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 工作计划列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="计划标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="标签" prop="label" width="120" show-overflow-tooltip />
      <el-table-column label="类型" prop="type" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_PLAN_TYPE" :value="scope.row.type ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_PLAN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="开始时间" prop="startTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="结束时间" prop="endTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="发布时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="发布人" prop="userName" width="110" />
      <el-table-column label="部门" prop="deptName" width="120" />
      <el-table-column label="点评" min-width="180">
        <template #default="scope">
          <div class="whitespace-pre-line">{{ scope.row.comment || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="附件" width="80" align="center">
        <template #default="scope">
          <span v-if="scope.row.fileUrls?.length">{{ scope.row.fileUrls.length }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            link
            v-hasPermi="['oa:plan:update']"
            @click="openForm('update', scope.row.id)"
          >
            修改
          </el-button>
          <el-button
            type="danger"
            link
            v-hasPermi="['oa:plan:delete']"
            @click="handleDelete(scope.row.id)"
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
  <!-- 工作计划表单 -->
  <OaPlanForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance } from 'element-plus'
import * as PlanApi from '@/api/oa/plan'
import { dateFormatter } from '@/utils/formatTime'
import OaPlanForm from './OaPlanForm.vue'

defineOptions({ name: 'OaPlanList' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表加载中
const list = ref<PlanApi.OaPlanVO[]>([]) // 工作计划列表
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  label: undefined,
  type: undefined,
  status: undefined,
  createTime: undefined
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 搜索表单 Ref
const formRef = ref<InstanceType<typeof OaPlanForm>>() // 工作计划表单 Ref

/** 查询工作计划列表 */
async function getList() {
  loading.value = true
  try {
    const data = await PlanApi.getPlanPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PlanApi.deletePlan(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
