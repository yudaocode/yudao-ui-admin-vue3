<script lang="ts" setup>
import { CSSProperties } from 'vue'
import { cloneDeep } from 'lodash-es'
import { IconJson } from '@/components/Icon/src/data'

defineOptions({ name: 'IconSelect' })

type ParameterCSSProperties = (item?: string) => CSSProperties | undefined

const props = defineProps({
  modelValue: {
    require: false,
    type: String
  },
  clearable: {
    require: false,
    type: Boolean
  }
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string) }>()

const visible = ref(false)
// 输入框手动输入时，通过 emit 同步绑定值（props 只读，不能直接修改）
const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? '')
})
const iconList = ref(IconJson)
// 输入框右侧预览的图标：未选择时展示默认图标
const previewIcon = computed(() => props.modelValue || 'ep:add-location')
const currentActiveType = ref('ep:')
// 深拷贝图标数据，前端做搜索
const copyIconList = cloneDeep(iconList.value)

const pageSize = ref(96)
const currentPage = ref(1)

// 搜索条件
const filterValue = ref('')

const tabsList = [
  {
    label: 'Element Plus',
    name: 'ep:'
  },
  {
    label: 'Font Awesome 4',
    name: 'fa:'
  },
  {
    label: 'Font Awesome 5 Solid',
    name: 'fa-solid:'
  }
]

// 当前分类下，按搜索条件过滤后的图标
const filterIconList = computed<string[]>(() => {
  const keyword = filterValue.value.trim().toLowerCase()
  return (copyIconList[currentActiveType.value] ?? []).filter((v) => v.includes(keyword))
})
const pageList = computed(() => {
  const start = pageSize.value * (currentPage.value - 1)
  return filterIconList.value.slice(start, start + pageSize.value)
})
// 分页总数使用过滤后的数量，避免搜索后出现空白页
const iconCount = computed(() => filterIconList.value.length)

const iconItemStyle = computed((): ParameterCSSProperties => {
  return (item) => {
    if (inputValue.value === currentActiveType.value + item) {
      return {
        borderColor: 'var(--el-color-primary)',
        color: 'var(--el-color-primary)'
      }
    }
  }
})

// 切换分类只切换展示的图标，不修改绑定值
function handleClick({ props }) {
  currentPage.value = 1
  currentActiveType.value = props.name
}

function onChangeIcon(item) {
  emit('update:modelValue', currentActiveType.value + item)
  visible.value = false
}

function onCurrentChange(page) {
  currentPage.value = page
}

function clearIcon() {
  emit('update:modelValue', '')
  visible.value = false
}

// 绑定值变化（含编辑回显）时，定位到所属分类及所在页
watch(
  () => {
    return props.modelValue
  },
  () => {
    const index = props.modelValue ? props.modelValue.indexOf(':') : -1
    if (index < 0) {
      return
    }
    const type = props.modelValue!.substring(0, index + 1)
    if (!tabsList.some((tab) => tab.name === type)) {
      return
    }
    currentActiveType.value = type
    const iconIndex = filterIconList.value.indexOf(props.modelValue!.substring(index + 1))
    currentPage.value = iconIndex >= 0 ? Math.floor(iconIndex / pageSize.value) + 1 : 1
  },
  { immediate: true }
)
watch(
  () => {
    return filterValue.value
  },
  () => {
    currentPage.value = 1
  }
)
</script>

<template>
  <div class="selector">
    <ElInput
      v-model="inputValue"
      @click="visible = !visible"
      :clearable="props.clearable"
      @clear="clearIcon"
    >
      <template #append>
        <ElPopover
          :persistent="false"
          :popper-options="{
            placement: 'auto'
          }"
          :visible="visible"
          :width="355"
          popper-class="pure-popper"
          trigger="click"
        >
          <template #reference>
            <div
              class="h-32px w-40px flex cursor-pointer items-center justify-center"
              @click="visible = !visible"
            >
              <Icon :icon="previewIcon" />
            </div>
          </template>

          <ElInput v-model="filterValue" class="p-2" clearable placeholder="搜索图标" />
          <ElDivider border-style="dashed" />

          <ElTabs v-model="currentActiveType" @tab-click="handleClick">
            <ElTabPane
              v-for="(pane, index) in tabsList"
              :key="index"
              :label="pane.label"
              :name="pane.name"
            >
              <!-- 各 tab 共用同一份分页数据，只渲染当前 tab，避免重复渲染图标 -->
              <template v-if="pane.name === currentActiveType">
                <ElDivider border-style="dashed" class="tab-divider" />
                <ElScrollbar height="220px">
                  <ul class="ml-2 flex flex-wrap">
                    <li
                      v-for="(item, key) in pageList"
                      :key="key"
                      :style="iconItemStyle(item)"
                      :title="item"
                      class="icon-item mr-2 mt-1 w-1/10 flex cursor-pointer items-center justify-center border border-solid p-2"
                      @click="onChangeIcon(item)"
                    >
                      <Icon :icon="currentActiveType + item" />
                    </li>
                  </ul>
                </ElScrollbar>
              </template>
            </ElTabPane>
          </ElTabs>
          <ElDivider border-style="dashed" />

          <ElPagination
            :current-page="currentPage"
            :page-size="pageSize"
            :total="iconCount"
            background
            class="h-10 flex items-center justify-center"
            layout="prev, pager, next"
            size="small"
            @current-change="onCurrentChange"
          />
        </ElPopover>
      </template>
    </ElInput>
  </div>
</template>

<style lang="scss" scoped>
.el-divider--horizontal {
  margin: 1px auto !important;
}

.tab-divider.el-divider--horizontal {
  margin: 0 !important;
}

.icon-item {
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    transform: scaleX(1.05);
    transition: all 0.4s;
  }
}

:deep(.el-tabs__nav-next) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: -5px 0 5px -6px #ccc;
}

:deep(.el-tabs__nav-prev) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: 5px 0 5px -6px #ccc;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-tabs__item) {
  height: 30px;
  font-size: 12px;
  font-weight: normal;
  line-height: 30px;
}

:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap) {
  position: static;
  margin: 0;
}
</style>
