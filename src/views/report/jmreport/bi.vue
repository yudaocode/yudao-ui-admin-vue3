<template>
  <doc-alert title="大屏设计器" url="https://doc.iocoder.cn/screen/" />

  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { getRefreshToken } from '@/utils/auth'

defineOptions({ name: 'JimuBI' })

// 使用 getRefreshToken() 方法，而不使用 getAccessToken() 方法的原因：积木报表无法方便的刷新访问令牌
const src = ref(import.meta.env.VITE_BASE_URL + '/drag/list?token=' + getRefreshToken())
</script>
