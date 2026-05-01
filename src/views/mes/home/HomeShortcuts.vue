<!-- 首页快捷入口网格 -->
<template>
  <el-card shadow="hover" class="h-full">
    <template #header>
      <div class="flex justify-between items-center">
        <span class="text-16px font-600">快捷入口</span>
      </div>
    </template>
    <el-row :gutter="16">
      <el-col v-for="item in shortcuts" :key="item.name" :span="8" class="mb-16px">
        <div
          class="flex flex-col items-center gap-8px cursor-pointer py-12px rounded-8px transition-all hover:bg-[var(--el-fill-color-light)] hover:translate-y--2px"
          @click="emit('navigate', item.routeName)"
        >
          <div
            class="w-48px h-48px rounded-12px flex items-center justify-center"
            :style="{ background: item.bgColor }"
          >
            <Icon :icon="item.icon" :size="24" color="#fff" />
          </div>
          <span class="text-13px color-[var(--el-text-color-regular)]">{{ item.name }}</span>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script lang="ts" setup>
defineOptions({ name: 'HomeShortcuts' })

const emit = defineEmits<{
  navigate: [name: string]
}>()

/** 快捷入口列表，3×3 网格布局与工单状态分布面板等高 */
const shortcuts = [
  { name: '生产工单', icon: 'ep:document', routeName: 'MesProWorkOrder', bgColor: '#409EFF' },
  { name: '生产报工', icon: 'ep:edit', routeName: 'MesProFeedback', bgColor: '#67C23A' },
  { name: '质量检验', icon: 'ep:search', routeName: 'MesQcIqc', bgColor: '#E6A23C' },
  { name: '库存查询', icon: 'ep:box', routeName: 'MesWmMaterialStock', bgColor: '#F56C6C' },
  { name: '设备管理', icon: 'ep:cpu', routeName: 'MesDvMachinery', bgColor: '#7c3aed' },
  { name: '生产任务', icon: 'ep:list', routeName: 'MesProTask', bgColor: '#0ea5e9' },
  { name: '到货通知', icon: 'ep:van', routeName: 'MesWmArrivalNotice', bgColor: '#14b8a6' },
  { name: '设备维修', icon: 'ep:set-up', routeName: 'MesDvRepair', bgColor: '#f59e0b' },
  { name: '流转卡', icon: 'ep:tickets', routeName: 'MesProCard', bgColor: '#ec4899' }
]
</script>
