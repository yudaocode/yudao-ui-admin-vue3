<template>
  <Error type="500" @error-click="push('/')" />
</template>
<script lang="ts" name="Error500" setup>
const { push } = useRouter()
</script>
