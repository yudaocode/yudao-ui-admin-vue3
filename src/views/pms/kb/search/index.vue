<template>
  <doc-alert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />

  <!-- 搜索 -->
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" label-width="68px">
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          class="!w-240px"
          clearable
          placeholder="请输入文档标题或正文"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="知识库" prop="libraryId">
        <KnowledgeLibrarySelect
          v-model="queryParams.libraryId"
          class="!w-240px"
          placeholder="请选择知识库"
        />
      </el-form-item>
      <el-form-item label="创建人" prop="creatorUserId">
        <UserSelect
          v-model="queryParams.creatorUserId"
          class="!w-240px"
          placeholder="请选择创建人"
        />
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTime">
        <el-date-picker
          v-model="queryParams.updateTime"
          class="!w-240px"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          end-placeholder="结束日期"
          :shortcuts="defaultShortcuts"
          start-placeholder="开始日期"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="文档标题" min-width="280">
        <template #default="scope">
          <el-link type="primary" @click="openDocumentDetail(scope.row)">
            {{ scope.row.title }}
          </el-link>
          <span
            v-if="scope.row.fileSize !== undefined && scope.row.fileSize !== null"
            class="ml-4px text-12px text-[var(--el-text-color-secondary)]"
          >
            （{{ formatKnowledgeFileSize(scope.row.fileSize) }}）
          </span>
          <div
            v-if="scope.row.contentSummary"
            v-dompurify-html="highlightSummary(scope.row.contentSummary)"
            class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]"
          ></div>
        </template>
      </el-table-column>
      <el-table-column label="知识库" min-width="180" prop="libraryName" />
      <el-table-column align="center" label="类型" width="130">
        <template #default="scope">
          <DictTag :type="DICT_TYPE.PMS_KNOWLEDGE_DOCUMENT_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="创建人" prop="creatorUserName" width="130" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="更新时间"
        prop="updateTime"
        width="180"
      />
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentApi from '@/api/pms/kb/content/document'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, defaultShortcuts } from '@/utils/formatTime'
import KnowledgeLibrarySelect from '@/views/pms/kb/library/components/KnowledgeLibrarySelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { formatKnowledgeFileSize } from '@/views/pms/kb/utils/format'

defineOptions({ name: 'PmsKnowledgeSearch' })

const route = useRoute() // 当前路由
const router = useRouter() // 路由对象
const loading = ref(true) // 列表加载中
const total = ref(0) // 列表总数
const list = ref<KnowledgeDocumentApi.PmsKnowledgeDocumentVO[]>([]) // 文档列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: String(route.query.keyword || ''),
  libraryId: route.query.libraryId ? Number(route.query.libraryId) : undefined,
  creatorUserId: route.query.creatorUserId ? Number(route.query.creatorUserId) : undefined,
  updateTime: route.query.updateTime ? String(route.query.updateTime).split(',') : ([] as string[])
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref

/** 查询文档列表 */
async function getList() {
  loading.value = true
  try {
    const data = await KnowledgeDocumentApi.getKnowledgeDocumentSearchPage(queryParams)
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

/** 打开文档详情 */
function openDocumentDetail(document: KnowledgeDocumentApi.PmsKnowledgeDocumentVO) {
  router.push(`/pms/kb/library/${document.libraryId}/document/${document.id}`)
}

/** 在摘要中高亮当前关键词，内容经过 DOMPurify 指令处理。 */
function highlightSummary(summary: string) {
  const keyword = queryParams.keyword.trim()
  if (!keyword) return summary
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return summary.replace(new RegExp(`(${escapedKeyword})`, 'gi'), '<mark>$1</mark>')
}

/** 初始化 */
onMounted(() => {
  getList()
})

watch(
  () => route.query,
  (query) => {
    queryParams.keyword = String(query.keyword || '')
    queryParams.libraryId = query.libraryId ? Number(query.libraryId) : undefined
    queryParams.creatorUserId = query.creatorUserId ? Number(query.creatorUserId) : undefined
    queryParams.updateTime = query.updateTime ? String(query.updateTime).split(',') : []
    queryParams.pageNo = 1
    getList()
  }
)
</script>
