<template>
  <ContentWrap class="w-300px mb-[0!important] line-height-24px">
    <el-image :src="currentSong.imageUrl"/>
    <div class="">{{ currentSong.title }}</div>
    <div class="text-[var(--el-text-color-secondary)] text-12px line-clamp-1">
      {{ currentSong.desc }}
    </div>
    <div class="text-[var(--el-text-color-secondary)] text-12px">
      {{ currentSong.date }}
    </div>
    <el-button size="small" round class="my-6px">信息复用</el-button>
    <div class="text-[var(--el-text-color-secondary)] text-12px" v-html="currentSong.lyric"></div>
  </ContentWrap>
</template>

<script lang="ts" setup>

defineOptions({ name: 'Index' })

const currentSong = inject('currentSong', {})

</script>
