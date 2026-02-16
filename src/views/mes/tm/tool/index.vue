<!-- MES 工具台账列表 -->
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
      <el-form-item label="工具编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工具编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="工具名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工具名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="工具类型" prop="toolTypeId">
        <el-select
          v-model="queryParams.toolTypeId"
          placeholder="请选择工具类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in toolTypeList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="品牌" prop="brand">
        <el-input
          v-model="queryParams.brand"
          placeholder="请输入品牌"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="型号规格" prop="spec">
        <el-input
          v-model="queryParams.spec"
          placeholder="请输入型号规格"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_TOOL_STATUS)"
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
          v-hasPermi="['mes:tm-tool:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:tm-tool:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="工具编码" align="center" prop="code" />
      <el-table-column label="工具名称" align="center" prop="name" />
      <el-table-column label="品牌" align="center" prop="brand" />
      <el-table-column label="型号规格" align="center" prop="spec" />
      <el-table-column label="工具类型" align="center" prop="toolTypeName" />
      <el-table-column label="库存数量" align="center" prop="quantity" />
      <el-table-column label="可用数量" align="center" prop="quantityAvailable" />
      <el-table-column label="保养维护类型" align="center" prop="maintenType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_TM_MAINTEN_TYPE" :value="scope.row.maintenType" />
        </template>
      </el-table-column>
      <el-table-column label="下次保养" align="center" width="150">
        <template #default="scope">
          <span v-if="scope.row.maintenType === MesMaintenTypeEnum.REGULAR">
            {{ scope.row.nextMaintenDate ? formatDate(scope.row.nextMaintenDate) : '-' }}
          </span>
          <span v-else-if="scope.row.maintenType === MesMaintenTypeEnum.USAGE">
            {{ scope.row.nextMaintenPeriod != null ? scope.row.nextMaintenPeriod + ' 次' : '-' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_TM_TOOL_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="130">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:tm-tool:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:tm-tool:delete']"
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
  <ToolForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter, formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import { TmToolApi, TmToolVO } from '@/api/mes/tm/tool'
import { TmToolTypeApi, TmToolTypeVO } from '@/api/mes/tm/tool/type'
import ToolForm from './ToolForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesMaintenTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesTmTool' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<TmToolVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  toolTypeId: undefined,
  brand: undefined,
  spec: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const toolTypeList = ref<TmToolTypeVO[]>([]) // 工具类型列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TmToolApi.getToolPage(queryParams)
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
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await TmToolApi.deleteTool(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await TmToolApi.exportTool(queryParams)
    download.excel(data, '工具台账.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 加载工具类型列表
  toolTypeList.value = await TmToolTypeApi.getToolTypeSimpleList()
})
</script>
