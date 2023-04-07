<template>
  <el-alert v-if="getEnable()" type="success" show-icon>
    <template #title>
      <div @click="goToUrl">{{ '【' + title + '】文档地址：' + url }}</div>
    </template>
  </el-alert>
</template>
<script setup lang="tsx" name="DocAlert">
import { propTypes } from '@/utils/propTypes'

const props = defineProps({
  title: propTypes.string,
  url: propTypes.string
})

/** 跳转 URL 链接 */
const goToUrl = () => {
  window.open(props.url)
}

/** 是否开启 */
const getEnable = () => {
  return import.meta.env.VITE_APP_TENANT_ENABLE === 'true'
}
</script>
<style scoped>
.el-alert--success.is-light {
  border: 1px solid green;
  margin-bottom: 10px;
  cursor: pointer;
}
</style>
