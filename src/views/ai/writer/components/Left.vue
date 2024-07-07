<template>
  <!-- 定义tab组件 -->
  <DefineTab v-slot="{ active, text, itemClick }">
    <span
      class="inline-block w-1/2 rounded-full cursor-pointer text-center leading-[30px] relative z-1 text-[5C6370] hover:text-black"
      :class="active ? 'text-black shadow-md' : 'hover:bg-[#DDDFE3]'"
      @click="itemClick"
    >
      {{ text }}
    </span>
  </DefineTab>
  <!-- 定义label组件 -->
  <DefineLabel v-slot="{ label, hint, hintClick }">
    <h3 class="mt-5 mb-3 flex items-center justify-between text-[14px]">
      <span>{{ label }}</span>
      <span @click="hintClick" v-if="hint" class="flex items-center text-[12px] text-[#846af7]">
        <Icon icon="ep:question-filled" />
        {{ hint }}
      </span>
    </h3>
  </DefineLabel>
  <!-- TODO 小屏幕的时候是定位在左边的，大屏是分开的 -->
  <div class="relative" v-bind="$attrs">
    <!-- tab -->
    <div
      class="absolute left-1/2 top-2 -translate-x-1/2 w-[303px] rounded-full bg-[#DDDFE3] p-1 z-10"
    >
      <div
        class="flex items-center relative after:content-[''] after:block after:bg-white after:h-[30px] after:w-1/2 after:absolute after:top-0 after:left-0 after:transition-transform after:rounded-full"
        :class="selectedTab === 2 && 'after:transform after:translate-x-[100%]'"
      >
        <ReuseTab
          v-for="tab in tabs"
          :key="tab.value"
          :text="tab.text"
          :active="tab.value === selectedTab"
          :itemClick="() => switchTab(tab.value)"
        />
      </div>
    </div>
    <div
      class="px-7 pb-2 pt-[46px] overflow-y-auto lg:block w-[380px] box-border bg-[#ECEDEF] h-full"
    >
      <div>
        <template v-if="selectedTab === 1">
          <ReuseLabel label="写作内容" hint="示例" />
          <el-input
            type="textarea"
            :rows="5"
            :maxlength="500"
            v-model="writeForm.prompt"
            placeholder="请输入写作内容"
            showWordLimit
          />
        </template>

        <template v-else>
          <ReuseLabel label="原文" hint="示例" />
          <el-input
            type="textarea"
            :rows="5"
            :maxlength="500"
            v-model="writeForm.originalContent"
            placeholder="请输入原文"
            showWordLimit
          />

          <ReuseLabel label="回复内容" />
          <el-input
            type="textarea"
            :rows="5"
            :maxlength="500"
            v-model="writeForm.prompt"
            placeholder="请输入回复内容"
            showWordLimit
          />
        </template>

        <ReuseLabel label="长度" />
        <Tag v-model="writeForm.length" :tags="writeTags.lenTags" />
        <ReuseLabel label="格式" />
        <Tag v-model="writeForm.format" :tags="writeTags.formatTags" />
        <ReuseLabel label="语气" />
        <Tag v-model="writeForm.tone" :tags="writeTags.toneTags" />
        <ReuseLabel label="语言" />
        <Tag v-model="writeForm.language" :tags="writeTags.langTags" />

        <div class="flex items-center justify-center mt-3">
          <el-button>重置</el-button>
          <el-button @click="submit" color="#846af7">生成</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { createReusableTemplate } from '@vueuse/core'
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import Tag from './Tag.vue'
  import { WriteParams } from '@/api/ai/writer'
  import { omit } from 'lodash-es'
  import { getIntDictOptions } from '@/utils/dict'

  type TabType = WriteParams['type']

  const emits = defineEmits<{
    (e: 'submit', params: Partial<WriteParams>)
  }>()

  const selectedTab = ref<TabType>(1)
  const tabs: {
    text: string
    value: TabType
  }[] = [
    { text: '撰写', value: 1 },
    { text: '回复', value: 2 }
  ]
  const [DefineTab, ReuseTab] = createReusableTemplate<{
    active?: boolean
    text: string
    itemClick: () => void
  }>()

  const initData: WriteParams = {
    type: 1,
    prompt: '',
    originalContent: '',
    tone: 1,
    language: 1,
    length: 100,
    format: 1
  }
  const writeForm = ref<WriteParams>({ ...initData })

  const writeTags = {
    lenTags: getIntDictOptions('ai_write_length'),
    // 格式

    formatTags: getIntDictOptions('ai_write_format'),
    // 语气

    toneTags: getIntDictOptions('ai_write_tone'),
    // 语言
    langTags: getIntDictOptions('ai_write_language')
    //
  }

  const [DefineLabel, ReuseLabel] = createReusableTemplate<{
    label: string
    class?: string
    hint?: string
    hintClick?: () => void
  }>()

  const switchTab = (value: TabType) => {
    selectedTab.value = value
    writeForm.value = { ...initData }
  }

  const submit = () => {
    if (selectedTab.value === 2 && !writeForm.value.originalContent) {
      ElMessage.warning('请输入原文')
      return
    } else if (!writeForm.value.prompt) {
      ElMessage.warning(`请输入${selectedTab.value === 1 ? '写作' : '回复'}内容`)
      return
    }
    emits('submit', {
      ...(selectedTab.value === 1 ? omit(writeForm.value, ['originalContent']) : writeForm.value),
      type: selectedTab.value
    })
  }
</script>
