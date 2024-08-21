<template>
  <doc-alert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />

  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame v-if="!loading" v-loading="loading" :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/infra/config'

defineOptions({ name: 'InfraAdminServer' })

const loading = ref(true) // 是否加载中
const src = ref(import.meta.env.VITE_BASE_URL + '/admin/applications')

/** 初始化 */
onMounted(async () => {
  try {
    // 友情提示：如果访问出现 404 问题：
    // 1）boot 参考 https://doc.iocoder.cn/server-monitor/ 解决；
    // 2）cloud 参考 https://cloud.iocoder.cn/server-monitor/ 解决
    const data = await ConfigApi.getConfigKey('url.spring-boot-admin')
    if (data && data.length > 0) {
      src.value = data
    }
  } finally {
    loading.value = false
  }
})
</script>
