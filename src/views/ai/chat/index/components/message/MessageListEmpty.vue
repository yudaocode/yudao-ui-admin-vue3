<!-- 消息列表为空时，展示 prompt 列表 -->
<template>
  <div class="relative flex flex-row justify-center w-full h-full">
    <!-- title -->
    <div class="flex flex-col justify-center">
      <div class="text-28px font-bold text-center">芋道 AI</div>
      <div class="flex flex-row flex-wrap items-center justify-center w-460px mt-20px">
        <div
          class="flex justify-center w-180px leading-50px border border-solid border-[#e4e4e4] rounded-10px m-10px cursor-pointer hover:bg-[rgba(243,243,243,0.73)]"
          v-for="prompt in promptList"
          :key="prompt.prompt"
          @click="handlerPromptClick(prompt)"
        >
          {{ prompt.prompt }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const promptList = [
  {
    prompt: '今天气怎么样?'
  },
  {
    prompt: '写一首好听的诗歌?'
  }
] // prompt 列表

const emits = defineEmits(['onPrompt'])

/** 选中 prompt 点击 */
const handlerPromptClick = async ({ prompt }) => {
  emits('onPrompt', prompt)
}
</script>
