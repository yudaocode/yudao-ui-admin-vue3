<template>
  <div class="w-[350px] p-5 flex flex-col bg-[#f5f7f9]">
    <h3 class="w-full h-full h-7 text-5 text-center leading-[28px] title">思维导图创作中心</h3>
    <!--下面表单部分-->
    <div class="flex-grow overflow-y-auto">
      <div class="mt-[30ppx]">
        <el-text tag="b">您的需求？</el-text>
        <el-input
          v-model="formData.prompt"
          maxlength="1024"
          rows="5"
          class="w-100% mt-15px"
          input-style="border-radius: 7px;"
          placeholder="请输入提示词，让AI帮你完善"
          show-word-limit
          type="textarea"
        />
        <el-button
          class="!w-full mt-[15px]"
          type="primary"
          :loading="isGenerating"
          @click="emits('submit', formData)"
        >
          智能生成思维导图
        </el-button>
      </div>
      <div class="mt-[30px]">
        <el-text tag="b">使用已有内容生成？</el-text>
        <el-input
          v-model="generatedContent"
          maxlength="1024"
          rows="5"
          class="w-100% mt-15px"
          input-style="border-radius: 7px;"
          placeholder="例如：童话里的小屋应该是什么样子？"
          show-word-limit
          type="textarea"
        />
        <el-button
          class="!w-full mt-[15px]"
          type="primary"
          @click="emits('directGenerate', generatedContent)"
          :disabled="isGenerating"
        >
          直接生成
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MindMapContentExample } from '@/views/ai/utils/constants'

const emits = defineEmits(['submit', 'directGenerate'])
defineProps<{
  isGenerating: boolean
}>()
// 提交的提示词字段
const formData = reactive({
  prompt: ''
})

const generatedContent = ref(MindMapContentExample) // 已有的内容

defineExpose({
  setGeneratedContent(newContent: string) {
    // 设置已有的内容，在生成结束的时候将结果赋值给该值
    generatedContent.value = newContent
  }
})
</script>

<style lang="scss" scoped>
.title {
  color: var(--el-color-primary);
}
</style>
