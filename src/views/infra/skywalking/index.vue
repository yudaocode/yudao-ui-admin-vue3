<template>
  <doc-alert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />
  <ContentWrap>
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script setup lang="ts" name="Skywalking">
const src = ref('http://skywalking.shop.iocoder.cn')
</script>
