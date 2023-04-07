<template>
  <doc-alert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />
  <ContentWrap>
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script setup lang="ts" name="AdminServer">
const BASE_URL = import.meta.env.VITE_BASE_URL
const src = ref(BASE_URL + '/admin/applications')
</script>
