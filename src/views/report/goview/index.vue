<template>
  <ContentWrap>
    <IFrame :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
defineOptions({ name: 'GoView' })

const src = 'http://127.0.0.1:3000'
</script>
