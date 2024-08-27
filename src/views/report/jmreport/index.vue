<template>
  <doc-alert title="报表设计器" url="https://doc.iocoder.cn/report/" />

  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { getAccessToken } from '@/utils/auth'

defineOptions({ name: 'JimuReport' })

const src = ref(import.meta.env.VITE_BASE_URL + '/jmreport/list?token=' + getAccessToken())
</script>
