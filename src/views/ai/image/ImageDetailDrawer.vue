<template>
  <el-drawer
    v-model="showDrawer"
    title="图片详细"
    @close="handlerDrawerClose"
  >
    <span>Hi, there!</span>
  </el-drawer>
</template>

<script setup lang="ts">

const showDrawer = ref<boolean>(false) // 是否显示

const props = defineProps({
  show: {
    type: Boolean,
    require: true,
    default: false
  }
})


/**
 * 抽屉 - close
 */
const handlerDrawerClose = async () => {
  emits('handlerDrawerClose')
}

// watch
const { show } = toRefs(props)
watch(show, async (newValue, oldValue) => {
  showDrawer.value = newValue as boolean
})
//
const emits = defineEmits(['handlerDrawerClose'])

</script>
<style scoped lang="scss">

</style>
