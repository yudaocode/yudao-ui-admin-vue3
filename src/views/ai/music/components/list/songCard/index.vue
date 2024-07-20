<template>
  <div class="flex bg-[var(--el-bg-color-overlay)] p-12px mb-12px rounded-1">
    <div class="relative" @click="playSong">
      <el-image :src="songInfo.imageUrl" class="flex-none w-80px"/>
      <div class="bg-black bg-op-40 absolute top-0 left-0 w-full h-full flex items-center justify-center cursor-pointer">
        <Icon :icon="currentSong.id === songInfo.id ?  'solar:pause-circle-bold':'mdi:arrow-right-drop-circle'" :size="30" />
      </div>
    </div>
    <div class="ml-8px">
      <div>{{ songInfo.title }}</div>
      <div class="mt-8px text-12px text-[var(--el-text-color-secondary)] line-clamp-2">
        {{ songInfo.desc }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

defineOptions({ name: 'Index' })

defineProps({
  songInfo: {
    type: Object,
    default: () => ({})
  }
})

const emits = defineEmits(['play'])

const currentSong = inject('currentSong', {})

function playSong () {
  emits('play')
}
</script>
