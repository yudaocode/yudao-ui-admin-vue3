<template>
  <doc-alert title="数据库 MyBatis" url="https://doc.iocoder.cn/mybatis/" />
  <doc-alert title="多数据源（读写分离）" url="https://doc.iocoder.cn/dynamic-datasource/" />

  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame v-if="!loading" v-loading="loading" :src="url" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/infra/config'

defineOptions({ name: 'InfraDruid' })

const loading = ref(true) // 是否加载中
const url = ref(import.meta.env.VITE_BASE_URL + '/druid/index.html')

/** 初始化 */
onMounted(async () => {
  try {
    const data = await ConfigApi.getConfigKey('url.druid')
    if (data && data.length > 0) {
      url.value = data
    }
  } finally {
    loading.value = false
  }
})
</script>
