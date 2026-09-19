<template>
  <div
    v-loading="loading"
    class="relative flex min-h-116px cursor-pointer items-center gap-16px overflow-hidden rounded-8px p-20px text-white shadow-[0_4px_12px_rgb(0_0_0_/_8%)] transition-transform duration-200 hover:translate-y--2px bg-[linear-gradient(135deg,#e6a23c,#ebb563)]"
    @click="push('/oa/discussion/list')"
  >
    <!-- 数据区与图标区分开，窄屏时优先保留数据 -->
    <div class="min-w-0 flex-1">
      <div class="mb-4px text-14px opacity-90">讨论区</div>
      <div v-if="loadError" class="mt-4px truncate text-12px opacity-85" @click.stop="getList">
        加载失败，点击重试
      </div>
      <div v-else class="truncate text-28px font-600">{{ count }}</div>
      <div class="mt-4px truncate text-12px opacity-85">全部讨论与投票</div>
    </div>
    <div class="h-56px w-56px flex shrink-0 items-center justify-center rounded-16px bg-white/20">
      <Icon icon="ep:chat-dot-round" :size="30" />
    </div>
  </div>
</template>

<script setup lang="ts">
import * as DiscussionApi from '@/api/oa/discussion'

defineOptions({ name: 'OaHomeDiscussionCount' })

const { push } = useRouter() // 路由跳转
const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const count = ref(0) // 讨论区数量

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    count.value = (await DiscussionApi.getDiscussionPage({ pageNo: 1, pageSize: 1 })).total
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
