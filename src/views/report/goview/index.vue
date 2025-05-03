<template>
  <doc-alert title="大屏设计器" url="https://doc.iocoder.cn/report/screen/" />

  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { getAccessToken, getRefreshToken } from '@/utils/auth'

defineOptions({ name: 'GoView' })

const src = ref(
  `${import.meta.env.VITE_GOVIEW_URL}?accessToken=${getAccessToken()}&refreshToken=${getRefreshToken()}`
)
</script>
