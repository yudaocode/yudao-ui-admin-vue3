<template>
  <doc-alert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />

  <ContentWrap>
    <IFrame v-if="!loading" v-loading="loading" :src="src" />
  </ContentWrap>
</template>
<script setup lang="ts" name="InfraSkyWalking">
import * as ConfigApi from '@/api/infra/config'

const loading = ref(true) // 是否加载中
const src = ref('http://skywalking.shop.iocoder.cn')

/** 初始化 */
onMounted(async () => {
  try {
    const data = await ConfigApi.getConfigKey('url.skywalking')
    if (data && data.length > 0) {
      src.value = data
    }
  } finally {
    loading.value = false
  }
})
</script>
