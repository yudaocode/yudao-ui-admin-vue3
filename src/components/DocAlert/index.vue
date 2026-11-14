<template>
  <el-alert v-if="getEnable()" type="success" show-icon>
    <template #title>
      <!-- 原生链接：可键盘聚焦、Enter 打开，新窗口不持有 window.opener -->
      <a :href="url" class="doc-alert__link" rel="noopener noreferrer" target="_blank">
        {{ '【' + title + '】文档地址：' + url }}
      </a>
    </template>
  </el-alert>
</template>
<script setup lang="tsx">
defineOptions({ name: 'DocAlert' })

defineProps({
  title: { type: String },
  url: { type: String }
})

/** 是否开启 */
const getEnable = () => {
  return import.meta.env.VITE_APP_DOCALERT_ENABLE !== 'false'
}
</script>
<style scoped>
.el-alert--success.is-light {
  margin-bottom: 10px;
  cursor: pointer;
  border: 1px solid green;
}

/* 保持原文字样式：继承标题颜色、无下划线，整行可点击 */
.doc-alert__link {
  display: block;
  color: inherit;
  text-decoration: none;
}
</style>
