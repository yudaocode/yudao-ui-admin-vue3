<template>
  <Error type="403" @error-click="push('/')" />
</template>
<script lang="ts" name="Error403" setup>
const { push } = useRouter()
</script>
