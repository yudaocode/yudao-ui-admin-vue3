<!-- MES 生产任务进度展示 -->
<!-- TODO @芋艿：待 review -->
<template>
  <div v-loading="loading">
    <el-empty v-if="!list.length" description="暂无排产任务" />
    <div v-else class="flex flex-wrap gap-20px p-10px">
      <el-card
        v-for="task in list"
        :key="task.id"
        class="w-240px"
        shadow="hover"
      >
        <div class="text-center">
          <el-progress
            type="circle"
            :percentage="getProgress(task)"
            :width="100"
            :color="task.colorCode || '#00AEF3'"
          />
          <div class="mt-10px font-bold text-14px">{{ task.name }}</div>
          <div class="mt-5px text-12px text-gray-500">
            {{ task.processName }} - {{ task.workstationName }}
          </div>
          <div class="mt-5px text-12px">
            <dict-tag :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="task.status" />
          </div>
          <div class="mt-5px text-12px text-gray-400">
            排产: {{ task.quantity }} | 已产: {{ task.producedQuantity }} | 合格: {{ task.qualifyQuantity }}
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'

defineOptions({ name: 'ProTaskProgress' })

const props = defineProps<{
  workOrderId: number
}>()

const loading = ref(false)
const list = ref<ProTaskVO[]>([])

/** 计算进度百分比 */
const getProgress = (task: ProTaskVO): number => {
  if (!task.quantity || task.quantity === 0) return 0
  const percent = (task.producedQuantity / task.quantity) * 100
  return Math.min(Math.round(percent), 100)
}

/** 查询任务列表（复用 page 接口，按工单过滤） */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProTaskApi.getTaskPage({
      workOrderId: props.workOrderId,
      pageNo: 1,
      pageSize: 999
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

watch(() => props.workOrderId, () => getList())

onMounted(() => getList())
</script>
