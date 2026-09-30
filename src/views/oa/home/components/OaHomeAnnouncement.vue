<template>
  <OaHomePanel title="公告通知" v-loading="loading">
    <template #actions>
      <el-button link type="primary" @click="push('/oa/announcement/my')">更多</el-button>
    </template>
    <div v-if="loadError" class="mb-12px text-13px text-[var(--el-color-danger)]">
      加载失败，
      <el-button link type="primary" @click="getList">重新加载</el-button>
    </div>
    <el-table :data="list" :show-header="true" :show-overflow-tooltip="true">
      <el-table-column label="发布部门" min-width="130" prop="publisherDeptName" />
      <el-table-column align="center" label="优先级" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="scope.row.priority ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="标题" min-width="240">
        <template #default="scope">
          <el-button link type="primary" @click="detailRef?.open(scope.row.id, true)">
            {{ scope.row.title }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.readStatus ? 'info' : 'danger'">
            {{ scope.row.readStatus ? '已读' : '未读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="发布时间"
        prop="createTime"
        :formatter="dateFormatter"
        width="170"
      />
    </el-table>
    <OaAnnouncementDetail ref="detailRef" @read="handleRead" />
  </OaHomePanel>
</template>

<script setup lang="ts">
import OaHomePanel from './OaHomePanel.vue'
import OaAnnouncementDetail from '@/views/oa/announcement/list/components/OaAnnouncementDetail.vue'
import * as AnnouncementApi from '@/api/oa/announcement'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'OaHomeAnnouncement' })

const { push } = useRouter() // 路由跳转
const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const list = ref<AnnouncementApi.OaAnnouncementVO[]>([]) // 公告列表

const detailRef = ref<InstanceType<typeof OaAnnouncementDetail>>() // 公告详情

/** 详情读取成功后同步当前列表的阅读状态 */
function handleRead(id: number) {
  const announcement = list.value.find((item) => item.id === id)
  if (announcement) {
    announcement.readStatus = true
  }
}

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    list.value = (
      await AnnouncementApi.getReceivedAnnouncementPage({ pageNo: 1, pageSize: 5 })
    ).list
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
