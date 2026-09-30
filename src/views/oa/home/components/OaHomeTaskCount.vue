<template>
  <div
    v-loading="loading"
    class="relative flex min-h-116px cursor-pointer items-center gap-16px overflow-hidden rounded-8px p-20px text-white shadow-[0_4px_12px_rgb(0_0_0_/_8%)] transition-transform duration-200 hover:translate-y--2px bg-[linear-gradient(135deg,#f56c6c,#f78989)]"
    @click="push('/oa/task/my')"
  >
    <!-- 数据区与图标区分开，窄屏时优先保留数据 -->
    <div class="min-w-0 flex-1">
      <div class="mb-4px text-14px opacity-90">新任务</div>
      <div v-if="loadError" class="mt-4px truncate text-12px opacity-85" @click.stop="getList">
        加载失败，点击重试
      </div>
      <div v-else class="truncate text-28px font-600">{{ count }}</div>
      <div
        v-if="checkPermi(['oa:announcement:query'])"
        class="mt-4px truncate text-12px opacity-85"
      >
        <span v-if="unreadError" @click.stop="getUnreadCount">未读公告加载失败，点击重试</span>
        <span v-else>
          {{ unreadLoading ? '未读公告加载中' : '另有 ' + unreadCount + ' 条未读公告' }}
        </span>
      </div>
    </div>
    <div class="h-56px w-56px flex shrink-0 items-center justify-center rounded-16px bg-white/20">
      <Icon icon="ep:finished" :size="30" />
    </div>
  </div>
</template>

<script setup lang="ts">
import * as TaskApi from '@/api/oa/task'
import * as AnnouncementApi from '@/api/oa/announcement'
import { checkPermi } from '@/utils/permission'
import { OA_TASK_STATUS } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaHomeTaskCount' })

const { push } = useRouter() // 路由跳转
const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const count = ref(0) // 新任务数量
const unreadCount = ref(0) // 未读公告数量
const unreadLoading = ref(false) // 未读公告加载中
const unreadError = ref(false) // 未读公告加载失败

/** 查询未读公告数量 */
async function getUnreadCount() {
  unreadLoading.value = true
  unreadError.value = false
  try {
    const queryParams = { pageNo: 1, pageSize: 1, readStatus: false }
    unreadCount.value = (await AnnouncementApi.getReceivedAnnouncementPage(queryParams)).total
  } catch {
    unreadError.value = true
  } finally {
    unreadLoading.value = false
  }
}

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    count.value = (await TaskApi.getTaskStatusCount())[OA_TASK_STATUS.NEW] || 0
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  if (checkPermi(['oa:announcement:query'])) {
    getUnreadCount()
  }
  getList()
})
</script>
