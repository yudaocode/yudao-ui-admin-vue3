<template>
  <!-- 搜索 -->
  <content-wrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true">
      <el-form-item label="表名称" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="请输入表名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="表描述" prop="tableComment">
        <el-input
          v-model="queryParams.tableComment"
          placeholder="请输入表描述"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" v-hasPermi="['infra:codegen:create']" @click="openImportTable()">
          <Icon icon="ep:zoom-in" class="mr-5px" />{{ t('action.import') }}
        </el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="数据源" align="center" :formatter="dataSourceConfigNameFormat" />
      <el-table-column label="表名称" align="center" prop="tableName" width="200" />
      <el-table-column
        label="表描述"
        align="center"
        prop="tableComment"
        :show-overflow-tooltip="true"
        width="120"
      />
      <el-table-column label="实体" align="center" prop="className" width="200" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="更新时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="操作"
        align="center"
        width="300px"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handlePreview(scope.row)"
            v-hasPermi="['infra:codegen:preview']"
            >预览</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleUpdate(scope.row.id)"
            v-hasPermi="['infra:codegen:update']"
            >编辑</el-button
          >
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['infra:codegen:delete']"
            >删除</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleSynchDb(scope.row)"
            v-hasPermi="['infra:codegen:update']"
            >同步</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleGenTable(scope.row)"
            v-hasPermi="['infra:codegen:download']"
            >生成代码</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </content-wrap>

  <!-- 弹窗：导入表 -->
  <ImportTable ref="importRef" @ok="reload()" />
  <!-- 弹窗：预览代码 -->
  <Preview ref="previewRef" />
</template>
<script setup lang="ts" name="Codegen">
import download from '@/utils/download'
import * as CodegenApi from '@/api/infra/codegen'
import * as DataSourceConfigApi from '@/api/infra/dataSourceConfig'
import { CodegenTableVO } from '@/api/infra/codegen/types'
import { ImportTable, Preview } from './components'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import { DataSourceConfigVO } from '@/api/infra/dataSourceConfig'
import { dateFormatter } from '@/utils/formatTime'

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由跳转

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  tableName: undefined,
  tableComment: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

const dataSourceConfigs = ref<DataSourceConfigVO[]>([]) // 数据源列表

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CodegenApi.getCodegenTablePage(queryParams)
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

/** 初始化 **/
onMounted(async () => {
  getList()
  dataSourceConfigs.value = await DataSourceConfigApi.getDataSourceConfigList()
})

// 数据源配置的名字
const dataSourceConfigNameFormat = (row) => {
  for (const config of dataSourceConfigs.value) {
    if (row.dataSourceConfigId === config.id) {
      return config.name
    }
  }
  return '未知【' + row.leaderUserId + '】'
}

// 导入操作
const importRef = ref()
const openImportTable = () => {
  importRef.value.show()
}
// 预览操作
const previewRef = ref()
const handlePreview = (row: CodegenTableVO) => {
  previewRef.value.openModal(row.id)
}
// 编辑操作
const handleUpdate = (rowId: number) => {
  push('/codegen/edit?id=' + rowId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await CodegenApi.deleteCodegenTable(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}
// 同步操作
const handleSynchDb = async (row: CodegenTableVO) => {
  // 基于 DB 同步
  const tableName = row.tableName
  try {
    await message.confirm('确认要强制同步' + tableName + '表结构吗?', t('common.reminder'))
    await CodegenApi.syncCodegenFromDB(row.id)
    message.success('同步成功')
  } catch {}
}

// 生成代码操作
const handleGenTable = async (row: CodegenTableVO) => {
  const res = await CodegenApi.downloadCodegen(row.id)
  download.zip(res, 'codegen-' + row.className + '.zip')
}
</script>
