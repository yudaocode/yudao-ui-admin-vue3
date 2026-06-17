<template>
  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame :src="src" />
  </ContentWrap>
</template>

<script lang="ts" setup>
defineOptions({ name: 'IFrameView' })

const route = useRoute()

const src = computed(() => (route.meta.iframeSrc || route.meta.link || '') as string)
</script>
