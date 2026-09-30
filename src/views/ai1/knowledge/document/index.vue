<template>
  <!-- 头部 -->
  <ContentWrap>
    <el-page-header @back="close">
      <template #content>
        <span class="text-16px font-600">文档管理</span>
        <span class="ml-12px text-14px text-[var(--el-text-color-secondary)]">
          知识库：{{ knowledgeBase?.name || '-' }}
        </span>
      </template>
    </el-page-header>
  </ContentWrap>

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="文档名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入文档名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="处理状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择处理状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI1_KNOWLEDGE_DOCUMENT_STATUS)"
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
          v-hasPermi="['ai1:knowledge-document:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <!-- 上传文档 -->
        <el-upload
          class="mx-12px inline-block"
          :show-file-list="false"
          accept=".txt,.md"
          :before-upload="handleBeforeUpload"
          :http-request="handleUpload"
          :disabled="uploading"
          v-hasPermi="['ai1:knowledge-document:create']"
        >
          <el-button type="primary" plain :loading="uploading">
            <Icon icon="ep:upload" class="mr-5px" /> 上传文档
          </el-button>
        </el-upload>
        <el-button
          type="warning"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleVectorizeBatch"
          v-hasPermi="['ai1:knowledge-document:vectorize']"
        >
          <Icon icon="ep:magic-stick" class="mr-5px" /> 批量向量化
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleVectorizeAll"
          v-hasPermi="['ai1:knowledge-document:vectorize']"
        >
          <Icon icon="ep:magic-stick" class="mr-5px" /> 全部向量化
        </el-button>
        <el-button
          type="info"
          plain
          :disabled="!knowledgeBase"
          @click="openSearch"
          v-hasPermi="['ai1:knowledge:search']"
        >
          <Icon icon="ep:search" class="mr-5px" /> 检索测试
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleDeleteBatch"
          v-hasPermi="['ai1:knowledge-document:delete']"
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
      <el-table-column label="文档名称" align="center" prop="name" min-width="200" />
      <el-table-column label="字符数" align="center" prop="contentLength" width="100" />
      <el-table-column label="处理状态" align="center" prop="status" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI1_KNOWLEDGE_DOCUMENT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="分片数" align="center" prop="chunkCount" width="90" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180px" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleVectorize(scope.row.id)"
            v-hasPermi="['ai1:knowledge-document:vectorize']"
          >
            向量化
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['ai1:knowledge-document:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai1:knowledge-document:delete']"
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
  <KnowledgeDocumentForm ref="formRef" @success="getList" />
  <!-- 检索测试弹窗 -->
  <KnowledgeSearchForm ref="searchRef" />
</template>

<script setup lang="ts">
import type { UploadRawFile, UploadRequestOptions } from 'element-plus'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { KnowledgeBaseApi, KnowledgeBase } from '@/api/ai1/knowledge/base'
import { KnowledgeDocumentApi, KnowledgeDocument } from '@/api/ai1/knowledge/document'
import KnowledgeDocumentForm from './KnowledgeDocumentForm.vue'
import KnowledgeSearchForm from '../KnowledgeSearchForm.vue'

/** AI1 知识文档列表 */
defineOptions({ name: 'Ai1KnowledgeDocument' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { params } = useRoute() // 路由参数

const UPLOAD_EXTENSIONS = ['txt', 'md'] // 允许上传的文件扩展名
const UPLOAD_MAX_SIZE = 10 * 1024 * 1024 // 允许上传的文件大小：10MB

const knowledgeBaseId = Number(params.knowledgeBaseId) // 知识库编号
const knowledgeBase = ref<KnowledgeBase>() // 知识库信息
const loading = ref(true) // 列表的加载中
const list = ref<KnowledgeDocument[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  knowledgeBaseId,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const uploading = ref(false) // 上传的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await KnowledgeDocumentApi.getKnowledgeDocumentPage(queryParams)
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
  formRef.value.open(type, knowledgeBaseId, id)
}

/** 检索测试操作 */
const searchRef = ref()
const openSearch = () => {
  searchRef.value.open(knowledgeBase.value)
}

// ==================== 上传 ====================

/** 上传前校验 */
const handleBeforeUpload = (file: UploadRawFile) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!UPLOAD_EXTENSIONS.includes(extension)) {
    message.error('仅支持 .txt / .md 文本文件')
    return false
  }
  if (file.size > UPLOAD_MAX_SIZE) {
    message.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

/** 上传文档 */
const handleUpload = async (options: UploadRequestOptions) => {
  uploading.value = true
  try {
    await KnowledgeDocumentApi.uploadKnowledgeDocument(knowledgeBaseId, options.file)
    message.success('上传成功，请执行向量化')
    await getList()
  } finally {
    uploading.value = false
  }
}

// ==================== 向量化 ====================

/** 向量化 */
const handleVectorize = async (id: number) => {
  try {
    await message.confirm('确认对该文档执行向量化？将按知识库分片参数处理并写入向量库')
  } catch {
    return
  }
  // 无论成功失败，都刷新列表
  loading.value = true
  try {
    const chunkCount = await KnowledgeDocumentApi.vectorizeKnowledgeDocument(id)
    message.success(`向量化成功，共 ${chunkCount} 个分片`)
  } finally {
    await getList()
  }
}

/** 批量向量化 */
const handleVectorizeBatch = async () => {
  try {
    await message.confirm('确认对勾选的文档执行向量化？将按知识库分片参数处理并写入向量库')
  } catch {
    return
  }
  loading.value = true
  let successCount = 0
  let failureCount = 0
  for (const id of checkedIds.value) {
    try {
      await KnowledgeDocumentApi.vectorizeKnowledgeDocument(id)
      successCount++
    } catch {
      failureCount++
    }
  }
  showVectorizeResult(successCount, failureCount)
  await getList()
}

/** 全部向量化 */
const handleVectorizeAll = async () => {
  try {
    await message.confirm(
      '确认对该知识库下全部文档执行向量化？未向量化、失败的文档将被逐个处理并写入向量库'
    )
  } catch {
    return
  }
  loading.value = true
  try {
    const result = await KnowledgeDocumentApi.vectorizeKnowledgeDocumentAll(knowledgeBaseId)
    showVectorizeResult(result.successCount, result.failureCount)
  } finally {
    await getList()
  }
}

/** 展示向量化结果 */
const showVectorizeResult = (successCount: number, failureCount: number) => {
  const content = `向量化完成：成功 ${successCount} 个，失败 ${failureCount} 个`
  if (failureCount > 0) {
    message.warning(content)
  } else {
    message.success(content)
  }
}

// ==================== 删除 ====================

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await KnowledgeDocumentApi.deleteKnowledgeDocument(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起批量删除
    await KnowledgeDocumentApi.deleteKnowledgeDocumentList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([]) // 表格勾选的编号
const handleRowCheckboxChange = (records: KnowledgeDocument[]) => {
  checkedIds.value = records.map((item) => item.id!)
}

/** 关闭 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'Ai1Knowledge' })
}

/** 初始化 **/
onMounted(async () => {
  if (!knowledgeBaseId) {
    message.warning('参数错误，知识库不能为空！')
    close()
    return
  }
  getList()
  knowledgeBase.value = await KnowledgeBaseApi.getKnowledgeBase(knowledgeBaseId)
})
</script>
