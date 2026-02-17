<!-- MES 质检方案列表 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="方案编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入方案编号"
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
      <el-form-item label="检测种类" prop="types">
        <el-select
          v-model="queryParams.types"
          placeholder="请选择检测种类"
          clearable
          class="!w-240px"
        >
          <!-- TODO @AI：字典枚举 -->
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否启用" prop="enableFlag">
        <el-select
          v-model="queryParams.enableFlag"
          placeholder="请选择是否启用"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value as unknown as string"
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
          v-hasPermi="['mes:qc-template:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:qc-template:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column label="方案编号" align="center" prop="code" width="150" />
      <el-table-column label="方案名称" align="center" prop="name" min-width="200" />
      <el-table-column label="检测种类" align="center" prop="types" min-width="200">
        <template #default="scope">
          <!-- TODO @AI：t 改成 type 变量； -->
          <!-- TODO @AI：el-tag：里面也支持数组的； -->
          <template v-if="scope.row.types && scope.row.types.length">
            <el-tag v-for="t in scope.row.types" :key="t" size="small" class="mr-5px">
              <dict-tag :type="DICT_TYPE.MES_QC_TYPE" :value="t" />
            </el-tag>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="是否启用" align="center" prop="enableFlag" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.enableFlag" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-template:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-template:delete']"
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

  <!-- 子表标签页：检测指标项 + 产品关联 -->
  <!-- TODO @AI：是不是不用这个？？？有点奇怪； -->
  <ContentWrap>
    <template v-if="currentRow">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="检测指标项" name="indicator">
          <TemplateIndicatorList :template-id="currentRow.id" />
        </el-tab-pane>
        <el-tab-pane label="产品关联" name="item">
          <TemplateItemList :template-id="currentRow.id" />
        </el-tab-pane>
      </el-tabs>
    </template>
    <el-empty v-else description="请先在上方列表选择一条质检方案" />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <TemplateForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcTemplateApi, QcTemplateVO } from '@/api/mes/qc/template'
import TemplateForm from './TemplateForm.vue'
import TemplateIndicatorList from './TemplateIndicatorList.vue'
import TemplateItemList from './TemplateItemList.vue'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'MesQcTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<QcTemplateVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  types: undefined,
  enableFlag: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

const currentRow = ref<QcTemplateVO | null>(null) // 当前选中行
const activeTab = ref('indicator') // 当前激活标签页

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcTemplateApi.getTemplatePage(queryParams)
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

/** 行点击切换子表 */
const handleCurrentChange = (row: QcTemplateVO | null) => {
  currentRow.value = row
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
    await QcTemplateApi.deleteTemplate(id)
    message.success(t('common.delSuccess'))
    // 若删除的是当前选中行，清空子表
    if (currentRow.value?.id === id) {
      currentRow.value = null
    }
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await QcTemplateApi.exportTemplate(queryParams)
    download.excel(data, '质检方案.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
