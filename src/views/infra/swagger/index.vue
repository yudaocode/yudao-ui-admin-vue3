<template>
  <doc-alert title="接口文档" url="https://doc.iocoder.cn/api-doc/" />

  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame v-if="!loading" v-loading="loading" :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/infra/config'

defineOptions({ name: 'InfraSwagger' })

const loading = ref(true) // 是否加载中
const src = ref(import.meta.env.VITE_BASE_URL + '/doc.html') // Knife4j UI
// const src = ref(import.meta.env.VITE_BASE_URL + '/swagger-ui') // Swagger UI

/** 初始化 */
onMounted(async () => {
  try {
    const data = await ConfigApi.getConfigKey('url.swagger')
    if (data && data.length > 0) {
      src.value = data
    }
  } finally {
    loading.value = false
  }
})
</script>
