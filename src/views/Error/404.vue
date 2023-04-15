<template>
  <Error @error-click="push('/')" />
</template>
<script lang="ts" name="Error404" setup>
const { push } = useRouter()
</script>
