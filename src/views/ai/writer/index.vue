<template>
  <div class="h-[calc(100vh-var(--top-tool-height)-var(--app-footer-height)-40px)] -m-5 flex">
    <Left class="h-full" @submit="submit" />
    <Right class="flex-grow" :msg="msg" />
  </div>
</template>

<script setup lang="ts">
  import Left from './components/Left.vue'
  import Right from './components/Right.vue'
  import { writeStream } from '@/api/ai/writer'

  const msg = ref('')

  const submit = async (params) => {
    const res = await writeStream(params)
  }
</script>

<style scoped></style>
