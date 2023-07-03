<template>
  <Error @error-click="push('/')" />
</template>
<script lang="ts" setup>
defineOptions({ name: 'Error404' })
const { push } = useRouter()
</script>
