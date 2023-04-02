<template>
  <Dialog title="导入表" v-model="modelVisible" width="800px">
    <!-- 搜索栏 -->
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="数据源" prop="dataSourceConfigId">
        <el-select
          v-model="queryParams.dataSourceConfigId"
          placeholder="请选择数据源"
          class="!w-240px"
        >
          <el-option
            v-for="config in dataSourceConfigList"
            :key="config.id"
            :label="config.name"
            :value="config.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="表名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入表名称"
          clearable
          @keyup.enter="getList"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="表描述" prop="comment">
        <el-input
          v-model="queryParams.comment"
          placeholder="请输入表描述"
          clearable
          @keyup.enter="getList"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="getList"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 列表 -->
    <el-row>
      <el-table
        v-loading="dbTableLoading"
        @row-click="handleRowClick"
        ref="tableRef"
        :data="dbTableList"
        @selection-change="handleSelectionChange"
        height="260px"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="表名称" :show-overflow-tooltip="true" />
        <el-table-column prop="comment" label="表描述" :show-overflow-tooltip="true" />
      </el-table>
    </el-row>
    <!-- 操作 -->
    <template #footer>
      <el-button @click="handleImportTable" type="primary" :disabled="tableList.length === 0">
        导入
      </el-button>
      <el-button @click="close">关闭</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as CodegenApi from '@/api/infra/codegen'
import * as DataSourceConfigApi from '@/api/infra/dataSourceConfig'
import { ElTable } from 'element-plus'
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const dbTableLoading = ref(true) // 数据源的加载中
const dbTableList = ref<CodegenApi.DatabaseTableVO[]>([]) // 表的列表
const queryParams = reactive({
  name: undefined,
  comment: undefined,
  dataSourceConfigId: 0
})
const queryFormRef = ref() // 搜索的表单
const dataSourceConfigList = ref<DataSourceConfigApi.DataSourceConfigVO[]>([]) // 数据源列表

/** 查询表数据 */
const getList = async () => {
  dbTableLoading.value = true
  try {
    dbTableList.value = await CodegenApi.getSchemaTableList(queryParams)
  } finally {
    dbTableLoading.value = false
  }
}

/** 重置操作 */
const resetQuery = async () => {
  queryParams.name = undefined
  queryParams.comment = undefined
  queryParams.dataSourceConfigId = dataSourceConfigList.value[0].id as number
  await getList()
}

/** 打开弹窗 */
const open = async () => {
  // 加载数据源的列表
  dataSourceConfigList.value = await DataSourceConfigApi.getDataSourceConfigList()
  queryParams.dataSourceConfigId = dataSourceConfigList.value[0].id as number
  modelVisible.value = true
  // 加载表的列表
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 关闭弹窗 */
const close = () => {
  modelVisible.value = false
  tableList.value = []
}

const tableRef = ref<typeof ElTable>() // 表格的 Ref
const tableList = ref<string[]>([]) // 选中的表名

/** 处理某一行的点击 */
const handleRowClick = (row) => {
  unref(tableRef)?.toggleRowSelection(row)
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  tableList.value = selection.map((item) => item.name)
}

/** 导入按钮操作 */
const handleImportTable = async () => {
  await CodegenApi.createCodegenList({
    dataSourceConfigId: queryParams.dataSourceConfigId,
    tableNames: tableList.value
  })
  message.success('导入成功')
  emit('success')
  close()
}
const emit = defineEmits(['success'])
</script>
