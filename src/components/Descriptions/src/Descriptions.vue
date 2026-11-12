<script lang="ts" setup>
import { FunctionalComponent, PropType, VNodeChild } from 'vue'
import dayjs from 'dayjs'
import { get } from 'lodash-es'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'
import { useAppStore } from '@/store/modules/app'
import { DescriptionsSchema } from '@/types/descriptions'

defineOptions({ name: 'Descriptions' })

const appStore = useAppStore()

const mobile = computed(() => appStore.getMobile)

const attrs = useAttrs()

const slots = useSlots()

const props = defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def(''),
  collapse: propTypes.bool.def(true),
  columns: propTypes.number.def(1),
  schema: {
    type: Array as PropType<DescriptionsSchema[]>,
    default: () => []
  },
  data: {
    type: Object as PropType<any>,
    default: () => ({})
  },
  // 普通字段值为 null / undefined 时显示的占位文字（参考上游 83b09f09f）；默认空串，与原显示一致
  emptyText: propTypes.string.def(''),
  // 内容区内边距：上游 82245ee6d 直接删除了默认内边距，芋道保留默认 20px，改为按需传入实现同样的紧凑显示
  // 本属性为芋道适配（非上游新增）：0 表示无内边距，数字按 px，字符串原样；未传保持默认 p-20px
  contentPadding: {
    type: [Number, String] as PropType<number | string>,
    default: undefined
  }
})

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('descriptions')

const getBindValue = computed(() => {
  const delArr: string[] = [
    'title',
    'message',
    'collapse',
    'schema',
    'data',
    'class',
    'emptyText',
    'contentPadding'
  ]
  const obj = { ...attrs, ...props }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return obj
})

// 仅显式传入 contentPadding 时设置内联内边距，否则沿用 p-20px 类
const hasContentPadding = computed(() => props.contentPadding != null)
const contentStyle = computed(() => {
  if (!unref(hasContentPadding)) return undefined
  const padding = props.contentPadding as number | string
  return { padding: typeof padding === 'number' ? `${padding}px` : padding }
})

// 渲染 schema 中的 slots 渲染函数（返回 VNode / 文本 / null）
const SchemaSlotRender: FunctionalComponent<{
  render: (...args: any[]) => VNodeChild
  params?: any
}> = (renderProps) => renderProps.render(renderProps.params)
SchemaSlotRender.props = ['render', 'params']

const getBindItemValue = (item: DescriptionsSchema) => {
  // slots 是渲染函数，不作为属性传给 ElDescriptionsItem
  const delArr: string[] = ['field', 'slots']
  const obj = { ...item }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return { labelClassName: `${prefixCls}-label`, ...obj }
}

// 按 field 读取数据，支持 a.b / a[0].b 嵌套路径；存在同名字面量键时与原来一样直接取该键
// field 为 '' 时也按普通键读取（与原 data[field] 一致）
const getFieldValue = (field: string) => {
  return get(props.data, field)
}

// 日期格式化：null 返回空串（原有约定）；嵌套路径缺失时也返回空串，避免 dayjs(undefined) 显示当前时间
// 普通字段为 undefined 时保持原有行为
const formatDate = (item: DescriptionsSchema) => {
  const value = getFieldValue(item.field)
  if (value === null) return ''
  const isPathField = !Reflect.has(props.data || {}, item.field) && /[.[]/.test(item.field)
  if (value === undefined && isPathField) return ''
  return dayjs(value).format(item.dateFormat)
}

// 折叠
const show = ref(true)

const toggleClick = () => {
  if (props.collapse) {
    show.value = !unref(show)
  }
}
</script>

<template>
  <div
    :class="[
      prefixCls,
      'bg-[var(--el-color-white)] dark:bg-[var(--el-bg-color)] dark:border-[var(--el-border-color)] dark:border-1px'
    ]"
  >
    <div
      v-if="title"
      :class="[
        `${prefixCls}-header`,
        'h-50px flex justify-between items-center b-b-1 border-solid border-[var(--el-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]'
      ]"
      @click="toggleClick"
    >
      <div :class="[`${prefixCls}-header__title`, 'relative font-18px font-bold ml-10px']">
        <div class="flex items-center">
          {{ title }}
          <ElTooltip v-if="message" :content="message" placement="right">
            <Icon class="ml-5px" icon="ep:warning" />
          </ElTooltip>
        </div>
      </div>
      <Icon v-if="collapse" :icon="show ? 'ep:arrow-down' : 'ep:arrow-up'" />
    </div>

    <ElCollapseTransition>
      <div
        v-show="show"
        :class="[`${prefixCls}-content`, { 'p-20px': !hasContentPadding }]"
        :style="contentStyle"
      >
        <ElDescriptions
          :column="props.columns"
          :direction="mobile ? 'vertical' : 'horizontal'"
          border
          v-bind="getBindValue"
        >
          <template v-if="slots['extra']" #extra>
            <slot name="extra"></slot>
          </template>
          <ElDescriptionsItem
            v-for="item in schema"
            :key="item.field"
            min-width="80"
            v-bind="getBindItemValue(item)"
          >
            <template #label>
              <slot
                :name="`${item.field}-label`"
                :row="{
                  label: item.label
                }"
              >
                <!-- 优先级：模板 #字段-label 插槽 > schema.slots.label(item) > label 文字 -->
                <SchemaSlotRender
                  v-if="item.slots?.label"
                  :params="item"
                  :render="item.slots.label"
                />
                <template v-else>{{ item.label }}</template>
              </slot>
            </template>

            <template #default>
              <!-- 优先级：模板 #字段 插槽 > schema.slots.default(data) > 原有日期/字典/字段映射/嵌套取值 -->
              <!-- 普通取值为 null / undefined 时显示 emptyText；0、false、'' 原样显示 -->
              <slot v-if="slots[item.field]" :name="item.field" :row="data"></slot>
              <SchemaSlotRender
                v-else-if="item.slots?.default"
                :params="data"
                :render="item.slots.default"
              />
              <slot v-else-if="item.dateFormat">
                {{ formatDate(item) }}
              </slot>
              <slot v-else-if="item.dictType">
                <DictTag :type="item.dictType" :value="getFieldValue(item.field) + ''" />
              </slot>
              <slot v-else :name="item.field" :row="data">
                {{ getFieldValue(item.mappedField || item.field) ?? emptyText }}
              </slot>
            </template>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </ElCollapseTransition>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-descriptions;

.#{$prefix-cls}-header {
  &__title {
    &::after {
      position: absolute;
      top: 3px;
      left: -10px;
      width: 4px;
      height: 70%;
      background: var(--el-color-primary);
      content: '';
    }
  }
}

.#{$prefix-cls} {
  :deep(.#{$prefix-cls}-label) {
    width: 150px;
  }
}
</style>
