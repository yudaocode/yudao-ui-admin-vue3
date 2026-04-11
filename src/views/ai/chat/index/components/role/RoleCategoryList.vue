<template>
  <div class="flex flex-row flex-wrap items-center">
    <div class="flex flex-row mr-10px" v-for="category in categoryList" :key="category">
      <el-button
        plain
        round
        size="small"
        :type="category === active ? 'primary' : ''"
        @click="handleCategoryClick(category)"
      >
        {{ category }}
      </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PropType } from 'vue'

// 定义属性
defineProps({
  categoryList: {
    type: Array as PropType<string[]>,
    required: true
  },
  active: {
    type: String,
    required: false,
    default: '全部'
  }
})

// 定义回调
const emits = defineEmits(['onCategoryClick'])

/** 处理分类点击事件 */
const handleCategoryClick = async (category: string) => {
  emits('onCategoryClick', category)
}
</script>
