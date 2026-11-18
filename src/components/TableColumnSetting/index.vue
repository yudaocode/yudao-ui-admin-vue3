<template>
  <el-button v-bind="$attrs" @click="drawerVisible = true">
    <Icon class="mr-5px" icon="ep:setting" />
    {{ buttonText }}
  </el-button>
  <el-drawer v-model="drawerVisible" :size="drawerSize" :title="buttonText" append-to-body>
    <el-checkbox-group
      v-model="checkedColumns"
      class="flex flex-col border-t border-[var(--el-border-color-lighter)]"
      @change="save"
    >
      <div
        v-for="column in columns"
        :key="column.prop"
        class="h-48px flex items-center border-b border-[var(--el-border-color-lighter)] px-4px"
      >
        <el-checkbox :value="column.prop" class="!mr-0 !h-full !w-full">
          {{ column.label }}
        </el-checkbox>
      </div>
    </el-checkbox-group>
    <template #footer>
      <div class="flex justify-between">
        <el-button @click="reset">
          <Icon class="mr-5px" icon="ep:refresh-left" />
          恢复默认
        </el-button>
        <el-button type="primary" @click="drawerVisible = false">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { useCache } from '@/hooks/web/useCache'

defineOptions({ name: 'TableColumnSetting', inheritAttrs: false })

interface TableColumn {
  label: string
  prop: string
  visible?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    buttonText?: string
    drawerSize?: string | number
    /** 列展示的本地存储 Key；不传时只在当前页面内生效 */
    storageKey?: string
  }>(),
  {
    buttonText: '列展示',
    drawerSize: 400
  }
)

// 列展示本地存储 Key 的前缀；存储在读写时才创建，浏览器禁止访问存储时只影响持久化，不影响组件本身
const STORAGE_KEY_PREFIX = 'tableColumnSetting:'

const checkedColumns = ref<string[]>([])
const drawerVisible = ref(false)

/** 获得已保存的列展示，按列 prop 记录是否展示；存储不可用或内容无效时返回 undefined */
const getSavedColumns = (): Record<string, boolean> | undefined => {
  if (!props.storageKey) {
    return undefined
  }
  try {
    const saved = useCache().wsCache.get(STORAGE_KEY_PREFIX + props.storageKey)
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : undefined
  } catch {
    return undefined
  }
}

/** 加载列展示：已保存的列按保存的设置，新增的列按自身默认 */
const load = () => {
  const savedColumns = getSavedColumns()
  checkedColumns.value = props.columns
    .filter((column) => {
      const saved = savedColumns?.[column.prop]
      return typeof saved === 'boolean' ? saved : column.visible !== false
    })
    .map((column) => column.prop)
}

/** 保存列展示：只保存当前列，已不存在的列不再保留 */
const save = () => {
  if (!props.storageKey) {
    return
  }
  const columns = Object.fromEntries(
    props.columns.map((column) => [column.prop, checkedColumns.value.includes(column.prop)])
  )
  try {
    useCache().wsCache.set(STORAGE_KEY_PREFIX + props.storageKey, columns)
  } catch {
    // 存储不可用时，列展示只在当前页面内生效
  }
}

/** 重置列展示，并清除已保存的设置 */
const reset = () => {
  checkedColumns.value = props.columns
    .filter((column) => column.visible !== false)
    .map((column) => column.prop)
  if (!props.storageKey) {
    return
  }
  try {
    useCache().wsCache.delete(STORAGE_KEY_PREFIX + props.storageKey)
  } catch {
    // 存储不可用时无需清除
  }
}

/** 判断列是否展示 */
const isVisible = (prop: string) => checkedColumns.value.includes(prop)

// 只在列集合或存储 Key 变化时重新加载，列名随模型等变化时保留已调整的列展示；加载只读取，不写入存储
watch(
  [() => props.storageKey, () => props.columns.map((column) => column.prop).join(',')],
  load,
  { immediate: true }
)

defineExpose({ isVisible, reset })
</script>
