<template>
<div class="flex h-full items-stretch">
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

/*
 *@Description: 拿到左侧配置信息调用右侧音乐生成的方法
 *@MethodAuthor: xiaohong
 *@Date: 2024-07-19 11:13:38
*/
function generateMusic (args: {formData: Recordable}) {
 unref(listRef)?.generateMusic(args.formData)
}
</script>
