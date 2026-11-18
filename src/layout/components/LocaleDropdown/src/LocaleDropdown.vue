<script lang="ts" setup>
import { camelize, useAttrs } from 'vue'
import { dropdownProps } from 'element-plus'
import { useLocaleStore } from '@/store/modules/locale'
import { useLocale } from '@/hooks/web/useLocale'
import { useDesign } from '@/hooks/web/useDesign'

// 属性由下方 getDropdownAttrs / getTriggerAttrs 分配，不自动落到 ElDropdown 根节点
defineOptions({ name: 'LocaleDropdown', inheritAttrs: false })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('locale-dropdown')

withDefaults(defineProps<{ color?: string }>(), { color: '' })

const { t } = useI18n()

const localeStore = useLocaleStore()

const langMap = computed(() => localeStore.getLocaleMap)

// 当前语言，对应菜单项禁用
const currentLang = computed(() => localeStore.getCurrentLocale.lang)

const { changeLocale } = useLocale()

// 不刷新页面切换语言，保留当前路由、标签页缓存与未保存的输入；
// changeLocale 同步切换 vue-i18n、Element Plus 语言、html lang 并持久化，是否已是当前语言由其判断
const setLang = (lang: LocaleType) => {
  changeLocale(lang)
}

// 外部属性分配（将属性透传到原生触发按钮）：
// - class 与原先一样同时作用在 ElDropdown 外层和触发按钮上；
// - ElDropdown 自身的 props（trigger、placement、disabled、id、tabindex 等，id / tabindex 由 ElDropdown 设到触发按钮上）
//   及其 visible-change、command 事件仍交给 ElDropdown；
// - 其余属性（title、aria-*、data-*、style、focus / keydown 等原生事件）落到触发按钮上；
// - click 声明为组件事件，不进入 attrs，由组件统一 emit，父级 @click.once 由 Vue 按组件实例只触发一次
const emit = defineEmits(['click'])
const attrs = useAttrs()
const dropdownAttrKeys = new Set([
  ...Object.keys(dropdownProps),
  'onVisibleChange',
  'onVisibleChangeOnce',
  'onCommand',
  'onCommandOnce'
])
const isDropdownAttr = (key: string) => key === 'class' || dropdownAttrKeys.has(camelize(key))
// 每次渲染时按当前 attrs 计算（attrs 非响应式，不用 computed）
const pickAttrs = (toDropdown: boolean) =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => isDropdownAttr(key) === toDropdown))
const getDropdownAttrs = () => pickAttrs(true)
const getTriggerAttrs = () => pickAttrs(false)
// 与 ElDropdown 的布尔 prop 判定一致：驼峰或短横线写法，空串（仅写属性名）或真值即为 true
const getBooleanAttr = (name: string) => {
  // vue 未导出 hyphenate，按其同样规则本地转换：splitButton -> split-button
  const value = attrs[name] ?? attrs[name.replace(/\B([A-Z])/g, '-$1').toLowerCase()]
  return value === '' || !!value
}
// disabled 交给 ElDropdown 只禁用弹层；同时设到原生触发按钮上，按钮不可聚焦，鼠标、键盘都不再触发原生 click。
const isDisabled = () => getBooleanAttr('disabled')
// split-button 模式下触发按钮位于 ElDropdown 主按钮内，主按钮留白点击、键盘 Enter 及内层点击冒泡都经 ElDropdown 的 click 通知；
// 内层按钮不再重复 emit。普通模式没有主按钮，由内层原生点击通知
const onDropdownClick = (event: MouseEvent) => emit('click', event)
const onTriggerClick = (event: MouseEvent) => {
  if (!getBooleanAttr('splitButton')) emit('click', event)
}
</script>

<template>
  <!-- v-bind 放在后面：与原先属性透传一致，调用方传入的 trigger 等仍可覆盖默认值，command 监听与内部切换同时生效 -->
  <ElDropdown
    :class="prefixCls"
    trigger="click"
    @click="onDropdownClick"
    @command="setLang"
    v-bind="getDropdownAttrs()"
  >
    <!-- 原生 button 作为触发器，可键盘聚焦并带可访问名称；外部 class 继续落在触发器上，
         调用方传入的 aria-label 等可覆盖默认值，type 始终为 button -->
    <button
      :aria-label="t('layout.switchLanguage')"
      v-bind="getTriggerAttrs()"
      :class="$attrs.class"
      :disabled="isDisabled()"
      class="locale-dropdown-trigger cursor-pointer !p-0"
      type="button"
      @click="onTriggerClick"
    >
      <Icon :color="color" :size="18" class="cursor-pointer" icon="ion:language-sharp" />
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-for="item in langMap"
          :key="item.lang"
          :command="item.lang"
          :disabled="item.lang === currentLang"
        >
          {{ item.name }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
<style lang="scss" scoped>
// :where 不增加优先级，只重置原生 button 默认样式；外部 class 的布局、颜色优先，保留 focus outline
:where(.locale-dropdown-trigger) {
  padding: 0;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
</style>
