<template>
  <ElDialog v-if="isModal" v-model="showSearch" :show-close="false" :title="t('layout.menuSearch')">
    <el-select
      filterable
      :reserve-keyword="false"
      remote
      :placeholder="t('layout.menuSearchPlaceholder')"
      :remote-method="remoteMethod"
      style="width: 100%"
      @change="handleChange"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </ElDialog>
  <div v-else class="header-action" @click.stop="setTopSearch(!showTopSearch)">
    <!-- 原生 button 便于键盘聚焦与读屏；不单独绑定点击，激活后冒泡到外层统一切换，只切换一次 -->
    <button
      :aria-expanded="showTopSearch"
      :aria-label="t('layout.menuSearch')"
      class="router-search-trigger"
      type="button"
    >
      <Icon icon="ep:search" :color="color" />
    </button>
    <el-select
      ref="topSelectRef"
      @click.stop
      filterable
      :reserve-keyword="false"
      remote
      :placeholder="t('layout.menuSearchPlaceholder')"
      :remote-method="remoteMethod"
      class="overflow-hidden transition-all-600"
      :class="showTopSearch ? '!w-220px ml2' : '!w-0'"
      @change="handleChange"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<script lang="ts" setup>
import type { RouteRecordNormalized } from 'vue-router'
import { getRouteTitle } from '@/utils/routeTitle'
import { createRouteLocation, resolveDynamicPath } from '@/utils/routeParams'
import { isUrl } from '@/utils/is'

const props = defineProps({
  isModal: {
    type: Boolean,
    default: true
  },
  color: { type: String, default: '' }
})

const { t } = useI18n()
const router = useRouter() // 路由对象
const showSearch = ref(false) // 是否显示弹框
const showTopSearch = ref(false) // 是否显示顶部搜索框
const topSelectRef = ref() // 顶部搜索框
const keyword = ref('') // 用户输入的值
// 路由表快照：router.getRoutes() 不是响应式，动态路由在本组件创建后注册，登出、重新登录时也会撤销、重新注册；
// 每次打开搜索和每次输入回调时重新读取，相同关键词也能拿到最新路由
const routes = shallowRef<RouteRecordNormalized[]>([])
const refreshRoutes = () => {
  routes.value = router.getRoutes()
}

// 可搜索的路由：有标题；不是只做重定向的目录；动态参数可由菜单参数（meta.params）补齐；
// 隐藏路由只有 canTo 时可搜索（与菜单一致），登录、错误页等隐藏路由不出现
const isSearchable = (route: RouteRecordNormalized): boolean => {
  const { meta } = route
  if (!meta?.title || route.redirect) return false
  if (meta.hidden && !meta.canTo) return false
  return !resolveDynamicPath(route.path, meta.params as Record<string, any> | undefined).includes(
    ':'
  )
}

const options = computed(() => {
  // 提示选项
  if (!keyword.value) {
    return []
  }
  // 从路由表快照筛选；按原始标题（静态路由的语言 key，兼容原有搜索）、展示标题（静态路由翻译后、后端菜单原文）及路径搜索，
  // 按展示标题显示（切换语言时随之更新）
  const list = routes.value
    .filter(isSearchable)
    .map((item) => ({ item, title: getRouteTitle(item.meta) }))
    .filter(({ item, title }) => {
      return (
        String(item.meta.title ?? '').indexOf(keyword.value) > -1 ||
        title.indexOf(keyword.value) > -1 ||
        item.path.indexOf(keyword.value) > -1
      )
    })
  return list.map(({ item, title }) => {
    return {
      label: `${title}${item.path}`,
      value: item.path
    }
  })
})

function remoteMethod(data: string) {
  refreshRoutes()
  keyword.value = data
}

// 与菜单点击一致：外链菜单新窗口打开；站内路由带上菜单配置的 query、hash、params
function handleChange(path: string) {
  hiddenSearch()
  hiddenTopSearch()
  const route = router.getRoutes().find((item) => item.path === path)
  if (!route) return
  const link = route.meta?.link
  if (typeof link === 'string') {
    window.open(link)
    return
  }
  if (isUrl(route.path)) {
    window.open(route.path)
    return
  }
  const name = typeof route.name === 'string' ? route.name : undefined
  router.push(createRouteLocation(route.path, route.meta, name))
}

function hiddenSearch() {
  showSearch.value = false
}

function hiddenTopSearch() {
  showTopSearch.value = false
}

// 顶部搜索框展开时聚焦输入，可直接键入
function setTopSearch(visible: boolean) {
  showTopSearch.value = visible
  if (visible) {
    nextTick(() => topSelectRef.value?.focus())
  }
}

// 打开搜索时刷新路由快照（弹框：Ctrl+K、openSearch；顶栏：点击图标、openSearch）
watch([showSearch, showTopSearch], ([modalVisible, topVisible]) => {
  if (modalVisible || topVisible) refreshRoutes()
})

function openSearch() {
  if (props.isModal) {
    showSearch.value = true
  } else {
    setTopSearch(true)
  }
}

onMounted(() => {
  window.addEventListener('keydown', listenKey)
  window.addEventListener('click', hiddenTopSearch)
})

onUnmounted(() => {
  window.removeEventListener('keydown', listenKey)
  window.removeEventListener('click', hiddenTopSearch)
})

// 监听 ctrl + k：只由弹框模式的实例（App.vue 中的全局搜索）响应，切换弹框；
// 顶栏模式（ToolHeader 中 isModal=false）不响应，避免同一快捷键同时打开两个搜索
function listenKey(event: KeyboardEvent) {
  if (!props.isModal) return
  if ((event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 'k') {
    // 阻止触发浏览器默认事件
    event.preventDefault()
    showSearch.value = !showSearch.value
  }
}

defineExpose({
  openSearch
})
</script>

<style lang="scss" scoped>
// :where 不增加优先级，只重置原生 button 默认样式，图标仍在外层 header-action 中居中，保留 focus outline
:where(.router-search-trigger) {
  display: inline-flex;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  align-items: center;
}
</style>
