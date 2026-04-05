<!-- TODO @AI：补充一些注释 -->
<template>
  <el-card shadow="hover">
    <template #header>
      <div class="flex justify-between items-center">
        <span class="text-16px font-600">快捷入口</span>
      </div>
    </template>
    <el-row :gutter="16">
      <el-col v-for="item in shortcuts" :key="item.name" :span="8" class="mb-16px">
        <div
          class="flex flex-col items-center gap-8px cursor-pointer py-12px rounded-8px transition-all hover:bg-[var(--el-fill-color-light)] hover:translate-y--2px"
          @click="emit('navigate', item.url)"
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
  navigate: [url: string]
}>()

// TODO @AI：可以搞 9 个么？然后高度和【工单状态分布】的高度一致，会好看点。
const shortcuts = [
  { name: '生产工单', icon: 'ep:document', url: '/mes/pro/workorder', bgColor: '#409EFF' },
  { name: '生产报工', icon: 'ep:edit', url: '/mes/pro/feedback', bgColor: '#67C23A' },
  { name: '质量检验', icon: 'ep:search', url: '/mes/qc/iqc', bgColor: '#E6A23C' },
  { name: '库存查询', icon: 'ep:box', url: '/mes/wm/materialstock', bgColor: '#F56C6C' },
  { name: '设备管理', icon: 'ep:cpu', url: '/mes/dv/machinery', bgColor: '#7c3aed' },
  { name: '库存流水', icon: 'ep:tickets', url: '/mes/wm/transaction', bgColor: '#0ea5e9' }
]
</script>
