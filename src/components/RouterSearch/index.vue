<template>
  <ElDialog v-model="showSearch" :show-close="false" title="菜单搜索">
    <el-select
      filterable
      :reserve-keyword="false"
      remote
      placeholder="请输入菜单内容"
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
</template>

<script lang="ts" setup>
const router = useRouter() // 路由对象
const showSearch = ref(false) // 是否显示弹框
const value: Ref = ref('') // 用户输入的值

const routers = router.getRoutes() // 路由对象
const options = computed(() => {
  // 提示选项
  if (!value.value) {
    return []
  }
  const list = routers.filter((item: any) => {
    if (item.meta.title?.indexOf(value.value) > -1 || item.path.indexOf(value.value) > -1) {
      return true
    }
  })
  return list.map((item) => {
    return {
      label: `${item.meta.title}${item.path}`,
      value: item.path
    }
  })
})

function remoteMethod(data) {
  // 这里可以执行相应的操作（例如打开搜索框等）
  value.value = data
}

function handleChange(path) {
  router.push({ path })
}

onMounted(() => {
  window.addEventListener('keydown', listenKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', listenKey)
})

// 监听 ctrl + k
function listenKey(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    showSearch.value = !showSearch.value
    // 这里可以执行相应的操作（例如打开搜索框等）
  }
}

defineExpose({
  openSearch: () => {
    showSearch.value = true
  }
})
</script>
