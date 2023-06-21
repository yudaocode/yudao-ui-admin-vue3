<template>
  <Error type="403" @error-click="push('/')" />
</template>
<script lang="ts" setup>
defineOptions({ name: 'Error403' })

const { push } = useRouter()
</script>
