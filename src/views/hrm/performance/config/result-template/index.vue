<template>
  <doc-alert
    title="【绩效】绩效模板、绩效计划"
    url="https://doc.iocoder.cn/hrm/performance/template-plan/"
  />

  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :model="queryParams"
      :inline="true"
      label-width="76px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="queryParams.name"
          clearable
          class="!w-220px"
          placeholder="请输入模板名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="formRef.open('create')"
          v-hasPermi="['hrm:performance:result-template:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          v-hasPermi="['hrm:performance:result-template:delete']"
          :disabled="!checkedIds.length"
          plain
          type="danger"
          @click="handleDeleteBatch"
        >
          <Icon icon="ep:delete" class="mr-5px" />批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" @selection-change="handleRowCheckboxChange">
      <el-table-column type="selection" width="50" />
      <el-table-column label="结果模板名称" prop="name" min-width="180" show-overflow-tooltip />
      <el-table-column label="等级设置" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          {{
            scope.row.levels
              ?.map((level) => level.name)
              .filter(Boolean)
              .join('、') || '-'
          }}
        </template>
      </el-table-column>
      <el-table-column label="创建人" align="center" prop="creatorName" width="120" />
      <el-table-column
        label="最近更新时间"
        align="center"
        prop="updateTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="140" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="formRef.open('update', scope.row.id)"
            v-hasPermi="['hrm:performance:result-template:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['hrm:performance:result-template:delete']"
          >
            删除
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

  <PerformanceResultTemplateForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as PerformanceResultTemplateApi from '@/api/hrm/performance/config/result-template'
import PerformanceResultTemplateForm from './PerformanceResultTemplateForm.vue'

defineOptions({ name: 'HrmPerformanceResultTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 加载中
const total = ref(0) // 列表总数
const list = ref<PerformanceResultTemplateApi.ResultTemplateVO[]>([]) // 列表数据
const checkedIds = ref<number[]>([]) // 选中的编号
const queryFormRef = ref() // 搜索表单 Ref
const formRef = ref() // 表单 Ref
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: ''
})

/** 查询结果模板列表 */
async function getList() {
  loading.value = true
  try {
    const data = await PerformanceResultTemplateApi.getPerformanceResultTemplatePage(queryParams)
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
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 删除结果模板 */
async function handleDelete(id?: number) {
  if (!id) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PerformanceResultTemplateApi.deletePerformanceResultTemplate(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 处理表格多选 */
function handleRowCheckboxChange(rows: PerformanceResultTemplateApi.ResultTemplateVO[]) {
  checkedIds.value = rows.map((row) => row.id).filter((id): id is number => !!id)
}

/** 批量删除结果模板 */
async function handleDeleteBatch() {
  try {
    await message.delConfirm()
    await PerformanceResultTemplateApi.deletePerformanceResultTemplateList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
