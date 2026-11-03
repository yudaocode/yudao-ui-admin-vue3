<script lang="ts" setup>
import { PropType } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Permission' })

const props = defineProps({
  // 权限标识，如 'system:user:create'；为数组时拥有其中任一权限即可
  permission: {
    type: [String, Array] as PropType<string | string[]>,
    required: true
  }
})

// 规范化为权限标识数组；空字符串、空数组、含非字符串或空字符串的数组视为无效，返回 undefined
const permissionList = computed(() => {
  const { permission } = props
  // 展开稀疏数组会把空位变成 undefined，使 every 也能拒绝这些无效项。
  const list = Array.isArray(permission) ? [...permission] : [permission]
  if (list.length === 0) return undefined
  const valid = list.every((item) => typeof item === 'string' && item.trim() !== '')
  return valid ? list : undefined
})

// 与 v-hasPermi 相同的判断（含 *:*:* 超级权限），依赖 userStore.permissions，权限变化后自动更新；
// 权限值无效时一律视为无权限（超级权限也不放行）
const allowed = computed(() => {
  const list = unref(permissionList)
  return !!list && hasPermission(list)
})
</script>

<template>
  <slot v-if="allowed"></slot>
  <!-- 无权限时的替代内容，可选 -->
  <slot v-else name="fallback"></slot>
</template>
