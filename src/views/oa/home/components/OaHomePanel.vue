<template>
  <el-card v-if="visible" shadow="never" :body-style="collapsed ? { padding: '0' } : undefined">
    <template #header>
      <div class="flex items-center justify-between gap-8px">
        <span>{{ title }}</span>
        <div class="flex items-center gap-8px">
          <slot name="actions"></slot>
          <el-button
            link
            :aria-label="`${collapsed ? '展开' : '收起'}${title}`"
            @click="collapsed = !collapsed"
          >
            <Icon :icon="collapsed ? 'ep:arrow-down' : 'ep:arrow-up'" />
          </el-button>
          <el-button link :aria-label="`关闭${title}`" @click="visible = false">
            <Icon icon="ep:close" />
          </el-button>
        </div>
      </div>
    </template>
    <div v-if="!collapsed"><slot></slot></div>
  </el-card>
</template>
<script setup lang="ts">
defineOptions({ name: 'OaHomePanel' })
defineProps<{ title: string }>()
const collapsed = ref(false) // 当前面板是否收起
const visible = ref(true) // 关闭后刷新页面恢复
</script>
