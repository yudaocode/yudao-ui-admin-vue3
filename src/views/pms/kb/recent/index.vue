<template>
  <doc-alert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />

  <ContentWrap>
    <!-- 时间分组 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="今天" name="todayItems" />
      <el-tab-pane label="昨天" name="yesterdayItems" />
      <el-tab-pane label="最近 30 天" name="recent30DayItems" />
    </el-tabs>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="activeItems" :show-overflow-tooltip="true">
      <el-table-column label="名称" min-width="260">
        <template #default="scope">
          <el-link type="primary" @click="openItem(scope.row)">
            <Icon class="mr-6px" :icon="getKnowledgeObjectIcon(scope.row.type)" />
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="scope">{{ getKnowledgeObjectTypeName(scope.row.type) }}</template>
      </el-table-column>
      <el-table-column label="所属知识库" min-width="180" prop="libraryName" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="浏览时间"
        prop="createTime"
        width="180"
      />
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as KnowledgeViewRecordApi from '@/api/pms/kb/interaction/view-record'
import { dateFormatter } from '@/utils/formatTime'
import { getKnowledgeObjectIcon, getKnowledgeObjectTypeName } from '@/views/pms/kb/utils/format'

defineOptions({ name: 'PmsKnowledgeRecent' })

const router = useRouter() // 路由对象
const loading = ref(false) // 数据加载中
const activeTab = ref<keyof KnowledgeViewRecordApi.PmsKnowledgeRecentListVO>('todayItems') // 当前时间分组
const recent = reactive<KnowledgeViewRecordApi.PmsKnowledgeRecentListVO>({
  todayItems: [],
  yesterdayItems: [],
  recent30DayItems: []
}) // 最近浏览数据

const activeItems = computed(() => recent[activeTab.value]) // 当前时间分组的访问记录

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    Object.assign(recent, await KnowledgeViewRecordApi.getKnowledgeRecentViewRecordList())
  } finally {
    loading.value = false
  }
}

/** 打开内容详情 */
function openItem(item: KnowledgeViewRecordApi.PmsKnowledgeInteractionItemVO) {
  if (item.documentId) {
    router.push(`/pms/kb/library/${item.libraryId}/document/${item.documentId}`)
    return
  }
  router.push(`/pms/kb/library/${item.libraryId}/folder/${item.folderId}`)
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
