<template>
  <doc-alert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />

  <ContentWrap>
    <el-tabs v-model="activeType" @tab-change="handleTypeChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="知识库" name="1" />
      <el-tab-pane label="文档" name="3" />
      <el-tab-pane label="文件夹" name="2" />
      <el-tab-pane label="文件" name="4" />
    </el-tabs>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="名称" min-width="260">
        <template #default="scope">
          <el-link type="primary" @click="openItem(scope.row)">
            <Icon class="mr-6px" :icon="getKnowledgeObjectIcon(scope.row.type)" />
            {{ scope.row.name }}
          </el-link>
          <div v-if="scope.row.description" class="text-12px text-[var(--el-text-color-secondary)]">
            {{ scope.row.description }}
          </div>
          <div
            v-if="scope.row.fileType || scope.row.fileSize != null"
            class="text-12px text-[var(--el-text-color-secondary)]"
          >
            <span v-if="scope.row.fileType">{{ scope.row.fileType.toUpperCase() }}</span>
            <span v-if="scope.row.fileType && scope.row.fileSize != null"> · </span>
            <span v-if="scope.row.fileSize != null">
              {{ formatKnowledgeFileSize(scope.row.fileSize) }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="scope">{{ getKnowledgeObjectTypeName(scope.row.type) }}</template>
      </el-table-column>
      <el-table-column label="所属知识库" min-width="180" prop="libraryName" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="内容更新时间"
        prop="targetUpdateTime"
        width="180"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="关注时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" fixed="right" label="是否关注" width="100">
        <template #default="scope">
          <el-switch :model-value="true" @change="handleCancelFavorite(scope.row)" />
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as KnowledgeFavoriteApi from '@/api/pms/kb/interaction/favorite'
import { dateFormatter } from '@/utils/formatTime'
import { PmsKnowledgeObjectType } from '@/views/pms/kb/utils/constants'
import {
  formatKnowledgeFileSize,
  getKnowledgeObjectIcon,
  getKnowledgeObjectTypeName
} from '@/views/pms/kb/utils/format'

// TODO DONE @AI：该页面实际调用 `/pms/kb/favorite` 接口并展示用户关注内容，已统一命名为 favorite。
defineOptions({ name: 'PmsKnowledgeFavorite' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const loading = ref(false) // 数据加载中
const activeType = ref('all') // 当前对象类型
const list = ref<KnowledgeFavoriteApi.PmsKnowledgeInteractionItemVO[]>([]) // 关注列表
const total = ref(0) // 数据总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined as number | undefined
}) // 查询参数

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await KnowledgeFavoriteApi.getKnowledgeFavoritePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 切换关注类型 */
function handleTypeChange(name: string | number) {
  queryParams.type = name === 'all' ? undefined : Number(name)
  queryParams.pageNo = 1
  getList()
}

/** 打开内容详情 */
function openItem(item: KnowledgeFavoriteApi.PmsKnowledgeInteractionItemVO) {
  if (item.type === PmsKnowledgeObjectType.LIBRARY) {
    router.push(`/pms/kb/library/${item.libraryId}`)
    return
  }
  if (item.documentId) {
    router.push(`/pms/kb/library/${item.libraryId}/document/${item.documentId}`)
    return
  }
  router.push(`/pms/kb/library/${item.libraryId}/folder/${item.folderId}`)
}

/** 取消关注 */
async function handleCancelFavorite(item: KnowledgeFavoriteApi.PmsKnowledgeInteractionItemVO) {
  try {
    // 取消关注的二次确认
    await message.confirm(`确认取消关注“${item.name}”吗？`)
    // 发起取消关注
    await KnowledgeFavoriteApi.deleteKnowledgeFavorite(item.type, item.entityId)
    message.success('已取消关注')
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
