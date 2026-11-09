<script lang="ts" setup>
import { useLocaleStore } from '@/store/modules/locale'
import { useLocale } from '@/hooks/web/useLocale'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'LocaleDropdown' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('locale-dropdown')

defineProps({
  color: propTypes.string.def('')
})

const { t } = useI18n()

const localeStore = useLocaleStore()

const langMap = computed(() => localeStore.getLocaleMap)

const currentLang = computed(() => localeStore.getCurrentLocale)

const setLang = (lang: LocaleType) => {
  if (lang === unref(currentLang).lang) return
  // 需要重新加载页面让整个语言多初始化
  window.location.reload()
  localeStore.setCurrentLocale({
    lang
  })
  const { changeLocale } = useLocale()
  changeLocale(lang)
}
</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click" @command="setLang">
    <!-- 原生 button 作为触发器，可键盘聚焦并带可访问名称（参考上游 c7f8db52d）；外部 class 继续落在触发器上 -->
    <button
      :aria-label="t('layout.switchLanguage')"
      :class="$attrs.class"
      class="locale-dropdown-trigger cursor-pointer !p-0"
      type="button"
    >
      <Icon :color="color" :size="18" class="cursor-pointer" icon="ion:language-sharp" />
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="item in langMap" :key="item.lang" :command="item.lang">
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
