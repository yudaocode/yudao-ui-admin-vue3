<template>
  <div :style="style">
    <el-row justify="end">
      <el-tooltip
        class="item"
        effect="dark"
        :content="showSearch ? '隐藏搜索' : '显示搜索'"
        placement="top"
        v-if="search"
      >
        <el-button circle @click="toggleSearch()">
          <Icon icon="ep:search" />
        </el-button>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="刷新" placement="top">
        <el-button circle @click="refresh()">
          <Icon icon="ep:refresh" />
        </el-button>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="显隐列" placement="top" v-if="isColumns">
        <el-button circle @click="showColumn()">
          <Icon icon="ep:menu" />
        </el-button>
      </el-tooltip>
    </el-row>
    <el-dialog :title="title" v-model="open" append-to-body>
      <el-transfer
        :titles="['显示', '隐藏']"
        v-model="value"
        :data="columns"
        @change="dataChange"
      />
    </el-dialog>
  </div>
</template>
<script lang="ts" setup name="RightToolbar">
import type { CSSProperties } from 'vue'
import type { columnsType } from '@/components/RightToolbar'
import { propTypes } from '@/utils/propTypes'
// 显隐数据
const value = ref<number[]>([])
// 弹出层标题
const title = ref('显示/隐藏')
// 是否显示弹出层
const open = ref(false)

const props = defineProps({
  showSearch: propTypes.bool.def(true),
  columns: {
    type: Array as PropType<columnsType[]>,
    default: () => []
  },
  search: propTypes.bool.def(true),
  gutter: propTypes.number.def(10)
})
const isColumns = computed(() => props.columns?.length > 0)
const style = computed((): CSSProperties => {
  const ret: CSSProperties = {}
  if (props.gutter) {
    ret.marginRight = `${props.gutter / 2}px`
  }
  return ret
})
const emit = defineEmits(['update:showSearch', 'queryTable'])
// 搜索
const toggleSearch = () => {
  emit('update:showSearch', !props.showSearch)
}
// 刷新
const refresh = () => {
  emit('queryTable')
}
// 右侧列表元素变化
const dataChange = (data: number[]) => {
  props.columns.forEach((item) => {
    const key: number = item.key!
    item.visible = !data.includes(key)
  })
}
// 打开显隐列dialog
const showColumn = () => {
  open.value = true
}
// 显隐列初始默认隐藏列
const init = () => {
  props.columns.forEach((item, index) => {
    if (item.visible === false) {
      value.value.push(index)
    }
  })
}
init()
</script>
<style lang="scss" scoped>
:deep(.el-transfer__button) {
  border-radius: 50%;
  padding: 12px;
  display: block;
  margin-left: 0px;
}
:deep(.el-transfer__button:first-child) {
  margin-bottom: 10px;
}
</style>
