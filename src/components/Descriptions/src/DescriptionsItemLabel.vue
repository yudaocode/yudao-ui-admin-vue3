<script setup lang="ts">
const { label } = defineProps({
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: false
  }
})
</script>

<template>
  <div class="cell-item">
    <Icon :icon="icon" v-if="icon" style="vertical-align: middle" :size="18" />
    {{ label }}
  </div>
</template>

<style scoped lang="scss">
.cell-item {
  display: inline;
}

.cell-item::after {
  content: ':';
}
</style>
