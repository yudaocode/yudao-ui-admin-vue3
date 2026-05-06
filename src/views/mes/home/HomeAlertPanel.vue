<!-- 首页待办与异常提醒面板 -->
<template>
  <el-card shadow="hover" class="h-full alert-card">
    <template #header>
      <div class="flex justify-between items-center">
        <span class="text-16px font-600">待办与异常</span>
      </div>
    </template>
    <div class="flex flex-col">
      <div
        v-for="item in alertItems"
        :key="item.label"
        class="flex items-center gap-12px px-20px py-16px cursor-pointer border-b border-b-[var(--el-border-color-lighter)] last:border-b-0 transition-colors hover:bg-[var(--el-fill-color-light)]"
        @click="emit('navigate', item.routeName)"
      >
        <div
          class="w-40px h-40px rounded-10px flex items-center justify-center flex-shrink-0"
          :class="item.iconClass"
        >
          <Icon :icon="item.icon" :size="20" />
        </div>
        <div class="flex-1 flex flex-col gap-2px">
          <span class="text-14px font-500">{{ item.label }}</span>
          <span class="text-12px color-[var(--el-text-color-placeholder)]">{{ item.desc }}</span>
        </div>
        <el-badge :value="item.count" :hidden="!item.count" class="flex-shrink-0" />
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { MesHomeSummaryVO } from '@/api/mes/home'

defineOptions({ name: 'HomeAlertPanel' })

const props = defineProps<{
  summary: MesHomeSummaryVO
}>()

const emit = defineEmits<{
  navigate: [name: string]
}>()

/** 待办提醒列表：每项包含标签、描述、图标、目标路由名称、数量 */
const alertItems = computed(() => [
  {
    label: '安灯报警',
    desc: '未处置的安灯呼叫',
    icon: 'ep:warning-filled',
    routeName: 'MesProAndon',
    count: props.summary.andonActiveCount,
    iconClass: 'bg-[rgba(245,108,108,0.1)] color-[#f56c6c]'
  },
  {
    label: '设备维修',
    desc: '待处理的维修工单',
    icon: 'ep:set-up',
    routeName: 'MesDvRepair',
    count: props.summary.repairActiveCount,
    iconClass: 'bg-[rgba(230,162,60,0.1)] color-[#e6a23c]'
  },
  {
    label: '待排产工单',
    desc: '草稿状态的生产工单',
    icon: 'ep:document-checked',
    routeName: 'MesProWorkOrder',
    count: props.summary.workOrderPrepareCount,
    iconClass: 'bg-[rgba(64,158,255,0.1)] color-[#409eff]'
  }
])
</script>

<style lang="scss" scoped>
.alert-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}
</style>
