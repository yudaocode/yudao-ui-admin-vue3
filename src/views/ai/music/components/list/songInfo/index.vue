<template>
  <ContentWrap class="w-300px mb-[0!important] line-height-24px">
    <el-image :src="imageUrl"/>
    <div class="">{{ title }}</div>
    <div class="text-[var(--el-text-color-secondary)] text-12px line-clamp-1">{{ desc }}</div>
    <div class="text-[var(--el-text-color-secondary)] text-12px">{{ date }}</div>
    <el-button size="small" round class="my-6px">信息复用</el-button>
    <div class="text-[var(--el-text-color-secondary)] text-12px" v-html="lyric"></div>
  </ContentWrap>
</template>

<script lang="ts" setup>

defineOptions({ name: 'Index' })

defineProps({
  imageUrl: {
    type: String
  },
  title: {
    type: String
  },
  desc: {
    type: String
  },
  date: {
    type: String
  },
  lyric: {
    type: String
  }
})
</script>
