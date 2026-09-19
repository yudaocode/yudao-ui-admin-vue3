<template>
  <doc-alert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />

  <el-row :gutter="20">
    <!-- 左侧标签列表 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <div class="mb-12px flex items-center justify-between">
          <span class="font-600">文档标签</span>
          <el-button
            v-hasPermi="['pms:kb:library:update']"
            link
            type="primary"
            @click="labelManageRef?.open()"
          >
            管理
          </el-button>
        </div>
        <el-input
          v-model="labelKeyword"
          class="mb-12px"
          clearable
          placeholder="请输入标签名称"
          prefix-icon="ep:search"
        />
        <div v-loading="labelLoading" class="min-h-120px">
          <el-scrollbar v-if="filteredLabelList.length" max-height="calc(100vh - 300px)">
            <div class="flex flex-col gap-6px">
              <el-button
                v-for="label in filteredLabelList"
                :key="label.id"
                :plain="selectedLabelId !== label.id"
                :type="selectedLabelId === label.id ? 'primary' : 'default'"
                class="!ml-0 !justify-start"
                @click="handleSelectLabel(label.id)"
              >
                <span
                  class="mr-8px h-10px w-10px shrink-0 rounded-full"
                  :style="{ backgroundColor: label.color }"
                ></span>
                <span class="truncate">{{ label.name }}</span>
              </el-button>
            </div>
          </el-scrollbar>
          <el-empty v-else :image-size="70" description="暂无标签" />
        </div>
      </ContentWrap>
    </el-col>

    <!-- 右侧文档列表 -->
    <el-col :span="20" :xs="24">
      <ContentWrap>
        <div v-if="selectedLabel" class="mb-16px flex items-center justify-between gap-12px">
          <div class="text-16px font-600"> 当前标签：{{ selectedLabel.name }}（{{ total }}） </div>
          <el-button link type="primary" @click="clearSelectedLabel"> 清除筛选 </el-button>
        </div>
        <el-table
          v-if="selectedLabel"
          v-loading="loading"
          :data="documentList"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="文档标题" min-width="240">
            <template #default="scope">
              <el-link type="primary" @click="openDocumentDetail(scope.row)">
                {{ scope.row.title }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="知识库" min-width="180" prop="libraryName" />
          <el-table-column label="创建人" prop="creatorUserName" width="130" />
          <el-table-column
            :formatter="dateFormatter"
            align="center"
            label="更新时间"
            prop="updateTime"
            width="180"
          />
        </el-table>
        <el-empty v-else description="暂无可用标签" />
        <Pagination
          v-if="selectedLabel"
          v-model:limit="queryParams.pageSize"
          v-model:page="queryParams.pageNo"
          :total="total"
          @pagination="getDocumentList"
        />
      </ContentWrap>
    </el-col>
  </el-row>

  <!-- 标签管理 -->
  <KnowledgeLabelManageDialog ref="labelManageRef" @success="getLabelList" />
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentApi from '@/api/pms/kb/content/document'
import * as KnowledgeDocumentLabelApi from '@/api/pms/kb/content/document/label'
import { dateFormatter } from '@/utils/formatTime'
import KnowledgeLabelManageDialog from './KnowledgeLabelManageDialog.vue'

defineOptions({ name: 'PmsKnowledgeDocumentLabel' })

const router = useRouter() // 路由
const route = useRoute() // 当前路由
const labelLoading = ref(true) // 标签列表加载中
const loading = ref(false) // 文档列表加载中
const labelList = ref<KnowledgeDocumentLabelApi.PmsKnowledgeDocumentLabelVO[]>([]) // 标签列表
const labelKeyword = ref('') // 标签关键字
const selectedLabelId = ref<number | undefined>(
  route.query.labelId ? Number(route.query.labelId) : undefined
) // 当前标签编号
const documentList = ref<KnowledgeDocumentApi.PmsKnowledgeDocumentVO[]>([]) // 文档列表
const total = ref(0) // 文档总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 }) // 查询参数
const labelManageRef = ref<InstanceType<typeof KnowledgeLabelManageDialog>>() // 标签管理 Ref

const filteredLabelList = computed(() =>
  labelList.value.filter((label) => label.name.includes(labelKeyword.value.trim()))
) // 筛选后的标签列表
const selectedLabel = computed(() =>
  labelList.value.find((label) => label.id === selectedLabelId.value)
) // 当前选中的标签

/** 获得标签列表 */
async function getLabelList() {
  labelLoading.value = true
  try {
    labelList.value = await KnowledgeDocumentLabelApi.getKnowledgeDocumentLabelList()
    if (!labelList.value.some((label) => label.id === selectedLabelId.value)) {
      selectedLabelId.value = labelList.value[0]?.id
      queryParams.pageNo = 1
    }
    await getDocumentList()
  } finally {
    labelLoading.value = false
  }
}

/** 查询文档列表 */
async function getDocumentList() {
  if (!selectedLabelId.value) {
    documentList.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const params = {
      ...queryParams,
      labelId: selectedLabelId.value
    }
    const data = await KnowledgeDocumentLabelApi.getKnowledgeDocumentPageByLabel(params)
    documentList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 选择标签 */
function handleSelectLabel(labelId: number) {
  selectedLabelId.value = labelId
  queryParams.pageNo = 1
  router.replace({ query: { labelId: String(labelId) } })
  getDocumentList()
}

/** 清除标签筛选，保留标签管理页但不强制选中首个标签 */
function clearSelectedLabel() {
  selectedLabelId.value = undefined
  queryParams.pageNo = 1
  documentList.value = []
  total.value = 0
  router.replace({ query: {} })
}

/** 打开文档详情 */
function openDocumentDetail(document: KnowledgeDocumentApi.PmsKnowledgeDocumentVO) {
  router.push(`/pms/kb/library/${document.libraryId}/document/${document.id}`)
}

/** 初始化 */
onMounted(() => {
  getLabelList()
})

watch(
  () => route.query.labelId,
  (labelId) => {
    selectedLabelId.value = labelId ? Number(labelId) : undefined
    getDocumentList()
  }
)
</script>
