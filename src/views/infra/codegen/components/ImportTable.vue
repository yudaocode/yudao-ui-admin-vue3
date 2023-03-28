<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form :model="queryParams" ref="queryFormRef" :inline="true">
      <el-form-item label="数据源" prop="dataSourceConfigId">
        <el-select v-model="queryParams.dataSourceConfigId" placeholder="请选择数据源">
          <el-option
            v-for="config in dataSourceConfigs"
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
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="表描述" prop="comment">
        <el-input
          v-model="queryParams.comment"
          placeholder="请输入表描述"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row>
      <el-table
        v-loading="dbLoading"
        @row-click="clickRow"
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

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleImportTable" type="primary" :disabled="tables.length === 0">{{
          t('action.import')
        }}</el-button>
        <el-button @click="handleClose">{{ t('dialog.close') }}</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import type { DatabaseTableVO } from '@/api/infra/codegen/types'
import * as CodegenApi from '@/api/infra/codegen'
import { getDataSourceConfigList, DataSourceConfigVO } from '@/api/infra/dataSourceConfig'
import { ElTable } from 'element-plus'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const emit = defineEmits(['ok'])

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('导入表') // 弹窗的标题
const dbLoading = ref(true)
const queryParams = reactive({
  name: undefined,
  comment: undefined,
  dataSourceConfigId: 0
})
const dataSourceConfigs = ref<DataSourceConfigVO[]>([])
const show = async () => {
  dataSourceConfigs.value = await getDataSourceConfigList()
  queryParams.dataSourceConfigId = dataSourceConfigs.value[0].id as number
  modelVisible.value = true
  await getList()
}
/** 查询表数据 */
const dbTableList = ref<DatabaseTableVO[]>([])

/** 查询表数据 */
const getList = async () => {
  dbLoading.value = true
  dbTableList.value = await CodegenApi.getSchemaTableList(queryParams)
  dbLoading.value = false
}
// 查询操作
const handleQuery = async () => {
  await getList()
}
// 重置操作
const resetQuery = async () => {
  queryParams.name = undefined
  queryParams.comment = undefined
  queryParams.dataSourceConfigId = dataSourceConfigs.value[0].id as number
  await getList()
}
const tableRef = ref<typeof ElTable>()
/** 多选框选中数据 */
const tables = ref<string[]>([])
const clickRow = (row) => {
  unref(tableRef)?.toggleRowSelection(row)
}
// 多选框选中数据
const handleSelectionChange = (selection) => {
  tables.value = selection.map((item) => item.name)
}
/** 导入按钮操作 */
const handleImportTable = async () => {
  await CodegenApi.createCodegenList({
    dataSourceConfigId: queryParams.dataSourceConfigId,
    tableNames: tables.value
  })
  message.success('导入成功')
  emit('ok')
  handleClose()
}
const handleClose = () => {
  modelVisible.value = false
  tables.value = []
}
defineExpose({
  show
})
</script>
