<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="82px"
    >
      <el-form-item label="知识库名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入知识库名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
          v-hasPermi="['ai1:knowledge:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleDeleteBatch"
          v-hasPermi="['ai1:knowledge:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> 批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleRowCheckboxChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="知识库名称" align="center" prop="name" min-width="140" />
      <el-table-column label="描述" align="center" prop="description" min-width="180" />
      <el-table-column
        label="向量化模型供应商"
        align="center"
        prop="embeddingProviderName"
        min-width="140"
      />
      <el-table-column
        label="向量化模型"
        align="center"
        prop="embeddingModelName"
        min-width="160"
      />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="260px" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDocument(scope.row.id)"
            v-hasPermi="['ai1:knowledge-document:query']"
          >
            文档管理
          </el-button>
          <el-button
            link
            type="primary"
            @click="openSearch(scope.row)"
            v-hasPermi="['ai1:knowledge:search']"
          >
            检索测试
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['ai1:knowledge:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai1:knowledge:delete']"
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
  <KnowledgeBaseForm ref="formRef" @success="getList" />
  <!-- 检索测试弹窗 -->
  <KnowledgeSearchForm ref="searchRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import { KnowledgeBaseApi, KnowledgeBase } from '@/api/ai1/knowledge/base'
import KnowledgeBaseForm from './KnowledgeBaseForm.vue'
import KnowledgeSearchForm from './KnowledgeSearchForm.vue'

/** AI1 知识库列表 */
defineOptions({ name: 'Ai1Knowledge' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<KnowledgeBase[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await KnowledgeBaseApi.getKnowledgeBasePage(queryParams)
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

/** 检索测试操作 */
const searchRef = ref()
const openSearch = (row: KnowledgeBase) => {
  searchRef.value.open(row)
}

/** 打开文档管理 */
const { push } = useRouter() // 路由
const openDocument = (id: number) => {
  push({ name: 'Ai1KnowledgeDocument', params: { knowledgeBaseId: id } })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm(
      '删除知识库将同时删除其下全部文档及 Milvus 向量集合，且不可恢复，是否确认删除？'
    )
    // 发起删除
    await KnowledgeBaseApi.deleteKnowledgeBase(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm(
      '删除知识库将同时删除其下全部文档及 Milvus 向量集合，且不可恢复，是否确认删除？'
    )
    // 发起批量删除
    await KnowledgeBaseApi.deleteKnowledgeBaseList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([]) // 表格勾选的编号
const handleRowCheckboxChange = (records: KnowledgeBase[]) => {
  checkedIds.value = records.map((item) => item.id!)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
