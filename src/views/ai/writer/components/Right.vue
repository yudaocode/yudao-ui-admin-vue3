<template>
  <div class="h-full box-border py-6 px-7">
    <div class="w-full h-full bg-white box-border p-3 sm:p-16 overflow-y-auto">
      <el-input
        type="textarea"
        :value="msg"
        autosize
        :input-style="{ boxShadow: 'none' }"
        resize="none"
        placeholder="生成的内容……"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    msg: {
      type: String,
      default: ''
    }
  })
</script>

<style scoped></style>
