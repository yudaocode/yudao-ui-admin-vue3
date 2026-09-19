<template>
  <doc-alert title="【PMS】项目模板" url="https://doc.iocoder.cn/pms/pm/project/" />

  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入模板名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="项目类型" prop="projectType">
        <el-select
          v-model="queryParams.projectType"
          class="!w-240px"
          clearable
          placeholder="请选择项目类型"
        >
          <el-option label="通用项目" :value="PmsProjectType.GENERAL" />
          <el-option label="敏捷开发项目" :value="PmsProjectType.AGILE" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-240px" clearable placeholder="请选择状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
        <el-button
          v-hasPermi="['pms:pm:project-template:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" />新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="模板名称" min-width="180" prop="name" />
      <el-table-column align="center" label="项目类型" prop="projectType" width="140">
        <template #default="scope">{{ formatProjectType(scope.row.projectType) }}</template>
      </el-table-column>
      <el-table-column align="center" label="事项类型" min-width="180">
        <template #default="scope">
          <el-tag v-for="type in scope.row.itemTypes" :key="type" class="mr-4px" effect="plain">
            {{ getWorkItemTypeName(type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态数" width="90">
        <template #default="scope">{{ scope.row.statuses.length }}</template>
      </el-table-column>
      <el-table-column align="center" label="看板列数" width="100">
        <template #default="scope">{{ scope.row.boards.length }}</template>
      </el-table-column>
      <el-table-column align="center" label="状态" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="排序" prop="sort" width="80" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" fixed="right" label="操作" width="140">
        <template #default="scope">
          <el-button
            v-hasPermi="['pms:pm:project-template:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['pms:pm:project-template:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 新增或修改项目模板 -->
  <ProjectTemplateForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ProjectTemplateApi from '@/api/pms/pm/project/template'
import { PmsProjectType } from '@/views/pms/pm/utils/constants'
import { formatProjectType, getWorkItemTypeName } from '@/views/pms/pm/utils/format'
import ProjectTemplateForm from './ProjectTemplateForm.vue'

defineOptions({ name: 'PmsProjectTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表加载中
const total = ref(0) // 列表总数
const list = ref<ProjectTemplateApi.PmsProjectTemplateVO[]>([]) // 模板列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  projectType: undefined,
  status: undefined
})
const queryFormRef = ref() // 查询表单 Ref

/** 查询项目模板列表 */
async function getList() {
  loading.value = true
  try {
    const data = await ProjectTemplateApi.getProjectTemplatePage(queryParams)
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
const formRef = ref()
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProjectTemplateApi.deleteProjectTemplate(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
