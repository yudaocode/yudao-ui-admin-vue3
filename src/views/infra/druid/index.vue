<template>
  <doc-alert title="数据库 MyBatis" url="https://doc.iocoder.cn/mybatis/" />
  <doc-alert title="多数据源（读写分离）" url="https://doc.iocoder.cn/dynamic-datasource/" />

  <ContentWrap>
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script setup lang="ts" name="Druid">
const BASE_URL = import.meta.env.VITE_BASE_URL
const src = ref(BASE_URL + '/druid/index.html')
</script>
