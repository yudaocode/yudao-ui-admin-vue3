<template>
  <Error type="500" @error-click="push('/')" />
</template>
<script lang="ts" setup>
defineOptions({ name: 'Error500' })
const { push } = useRouter()
</script>
