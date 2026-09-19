<template>
  <Dialog v-model="dialogVisible" title="日程详情" width="800px">
    <div v-loading="detailLoading">
      <!-- 日程信息 -->
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="日程标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="日程类型">
          <dict-tag :type="DICT_TYPE.OA_SCHEDULE_TYPE" :value="detail.type" />
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="detail.priority" />
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDate(detail.startTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatDate(detail.endTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="日程提醒">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detail.remind" />
        </el-descriptions-item>
        <el-descriptions-item label="日程描述">
          <div class="whitespace-pre-wrap break-words">{{ detail.description }}</div>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 参与人阅读情况 -->
      <div v-if="detail" class="mt-20px">
        <div class="mb-12px font-600">参与人阅读情况</div>
        <el-table :data="detail.participants || []">
          <el-table-column label="参与人" prop="userName" min-width="140" />
          <el-table-column label="阅读状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.readStatus ? 'success' : 'info'">
                {{ row.readStatus ? '已读' : '未读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="首次阅读时间"
            prop="readTime"
            :formatter="dateFormatter"
            min-width="180"
          />
        </el-table>
      </div>
    </div>
    <template #footer>
      <el-button
        v-if="detail?.creator === String(userStore.getUser.id)"
        v-hasPermi="['oa:schedule:update']"
        type="primary"
        :disabled="detailLoading"
        @click="handleEdit"
      >
        修 改
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as ScheduleApi from '@/api/oa/schedule'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate, dateFormatter } from '@/utils/formatTime'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'OaScheduleDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 详情加载中
const detail = ref<ScheduleApi.OaScheduleVO>() // 日程详情
const userStore = useUserStoreWithOut() // 当前用户信息
const emit = defineEmits(['edit']) // 修改日程事件

/** 修改日程 */
function handleEdit() {
  if (!detail.value?.id) return
  dialogVisible.value = false
  emit('edit', detail.value.id)
}

/** 打开日程详情 */
async function open(id: number) {
  if (detailLoading.value) return
  dialogVisible.value = true
  detail.value = undefined
  detailLoading.value = true
  try {
    // 查询并展示详情，关闭弹窗时不继续标记已读
    const data = await ScheduleApi.getSchedule(id)
    if (!dialogVisible.value) return
    detail.value = data
    await nextTick()
    // 仅本人参与且尚未阅读时提交，列表、日历和编辑表单不调用此接口
    const participant = detail.value?.participants?.find(
      (item) => item.userId === userStore.getUser.id
    )
    if (dialogVisible.value && participant && !participant.readStatus) {
      await ScheduleApi.updateScheduleReadStatus(id)
      detail.value = await ScheduleApi.getSchedule(id)
    }
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
