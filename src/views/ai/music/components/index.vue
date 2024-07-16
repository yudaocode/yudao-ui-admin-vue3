<template>
  <div class="flex ">
    <!-- 模式 -->
    <Mode class="flex-none" @generate-music="generateMusic"/>
    <!-- 音频列表 -->
    <List ref="listRef" class="flex-auto"/>
  </div>
</template>

<script lang="ts" setup>
import Mode from './mode/index.vue'
import List from './list/index.vue'

defineOptions({ name: 'Index' })

const listRef = ref<Nullable<{generateMusic: (...args) => void}>>(null)

function generateMusic (args: {formData: Recordable}) {
 unref(listRef)?.generateMusic(args.formData)
}
</script>
