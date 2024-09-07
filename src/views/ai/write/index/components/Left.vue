<template>
  <!-- 定义 tab 组件：撰写/回复等 -->
  <DefineTab v-slot="{ active, text, itemClick }">
    <span
      :class="active ? 'text-black shadow-md' : 'hover:bg-[#DDDFE3]'"
      class="inline-block w-1/2 rounded-full cursor-pointer text-center leading-[30px] relative z-1 text-[5C6370] hover:text-black"
      @click="itemClick"
    >
      {{ text }}
    </span>
  </DefineTab>
  <!-- 定义 label 组件：长度/格式/语气/语言等 -->
  <DefineLabel v-slot="{ label, hint, hintClick }">
    <h3 class="mt-5 mb-3 flex items-center justify-between text-[14px]">
      <span>{{ label }}</span>
      <span
        v-if="hint"
        class="flex items-center text-[12px] text-[#846af7] cursor-pointer select-none"
        @click="hintClick"
      >
        <Icon icon="ep:question-filled" />
        {{ hint }}
      </span>
    </h3>
  </DefineLabel>

  <div class="flex flex-col" v-bind="$attrs">
    <!-- tab -->
    <div class="w-full pt-2 bg-[#f5f7f9] flex justify-center">
      <div class="w-[303px] rounded-full bg-[#DDDFE3] p-1 z-10">
        <div
          :class="
            selectedTab === AiWriteTypeEnum.REPLY && 'after:transform after:translate-x-[100%]'
          "
          class="flex items-center relative after:content-[''] after:block after:bg-white after:h-[30px] after:w-1/2 after:absolute after:top-0 after:left-0 after:transition-transform after:rounded-full"
        >
          <ReuseTab
            v-for="tab in tabs"
            :key="tab.value"
            :active="tab.value === selectedTab"
            :itemClick="() => switchTab(tab.value)"
            :text="tab.text"
          />
        </div>
      </div>
    </div>
    <div
      class="px-7 pb-2 flex-grow overflow-y-auto lg:block w-[380px] box-border bg-[#f5f7f9] h-full"
    >
      <div>
        <template v-if="selectedTab === 1">
          <ReuseLabel :hint-click="() => example('write')" hint="示例" label="写作内容" />
          <el-input
            v-model="formData.prompt"
            :maxlength="500"
            :rows="5"
            placeholder="请输入写作内容"
            showWordLimit
            type="textarea"
          />
        </template>

        <template v-else>
          <ReuseLabel :hint-click="() => example('reply')" hint="示例" label="原文" />
          <el-input
            v-model="formData.originalContent"
            :maxlength="500"
            :rows="5"
            placeholder="请输入原文"
            showWordLimit
            type="textarea"
          />

          <ReuseLabel label="回复内容" />
          <el-input
            v-model="formData.prompt"
            :maxlength="500"
            :rows="5"
            placeholder="请输入回复内容"
            showWordLimit
            type="textarea"
          />
        </template>

        <ReuseLabel label="长度" />
        <Tag v-model="formData.length" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_LENGTH)" />
        <ReuseLabel label="格式" />
        <Tag v-model="formData.format" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_FORMAT)" />
        <ReuseLabel label="语气" />
        <Tag v-model="formData.tone" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_TONE)" />
        <ReuseLabel label="语言" />
        <Tag v-model="formData.language" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_LANGUAGE)" />

        <div class="flex items-center justify-center mt-3">
          <el-button :disabled="isWriting" @click="reset">重置</el-button>
          <el-button :loading="isWriting" color="#846af7" @click="submit">生成</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createReusableTemplate } from '@vueuse/core'
import { ref } from 'vue'
import Tag from './Tag.vue'
import { WriteVO } from '@/api/ai/write'
import { omit } from 'lodash-es'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { AiWriteTypeEnum, WriteExample } from '@/views/ai/utils/constants'

type TabType = WriteVO['type']

const message = useMessage() // 消息弹窗

defineProps<{
  isWriting: boolean
}>()

const emits = defineEmits<{
  (e: 'submit', params: Partial<WriteVO>)
  (e: 'example', param: 'write' | 'reply')
  (e: 'reset')
}>()

/** 点击示例的时候，将定义好的文章作为示例展示出来 **/
const example = (type: 'write' | 'reply') => {
  formData.value = {
    ...initData,
    ...omit(WriteExample[type], ['data'])
  }
  emits('example', type)
}

/** 重置，将表单值作为初选值 **/
const reset = () => {
  formData.value = { ...initData }
  emits('reset')
}

const selectedTab = ref<TabType>(AiWriteTypeEnum.WRITING)
const tabs: {
  text: string
  value: TabType
}[] = [
  { text: '撰写', value: AiWriteTypeEnum.WRITING },
  { text: '回复', value: AiWriteTypeEnum.REPLY }
]
const [DefineTab, ReuseTab] = createReusableTemplate<{
  active?: boolean
  text: string
  itemClick: () => void
}>()

/**
 * 可以在 template 里边定义可复用的组件，DefineLabel，ReuseLabel 是采用的解构赋值，都是 Vue 组件
 *
 * 直接通过组件的形式使用，<DefineLabel v-slot="{ label, hint, hintClick }"> 中间是需要复用的组件代码 <DefineLabel />，通过 <ReuseLabel /> 来使用定义的组件
 * DefineLabel 里边的 v-slot="{ label, hint, hintClick }"相当于是解构了组件的 prop，需要注意的是 boolean 类型，需要显式的赋值比如 <ReuseLabel :flag="true" />
 * 事件也得以 prop 形式传入，不能是 @event的形式，比如下面的 hintClick 需要<ReuseLabel :hintClick="() => { doSomething }"/>
 *
 * @see https://vueuse.org/createReusableTemplate
 */
const [DefineLabel, ReuseLabel] = createReusableTemplate<{
  label: string
  class?: string
  hint?: string
  hintClick?: () => void
}>()

const initData: WriteVO = {
  type: 1,
  prompt: '',
  originalContent: '',
  tone: 1,
  language: 1,
  length: 1,
  format: 1
}
const formData = ref<WriteVO>({ ...initData })

/** 用来记录切换之前所填写的数据，切换的时候给赋值回来 **/
const recordFormData = {} as Record<AiWriteTypeEnum, WriteVO>

/** 切换tab **/
const switchTab = (value: TabType) => {
  if (value !== selectedTab.value) {
    // 保存之前的久数据
    recordFormData[selectedTab.value] = formData.value
    selectedTab.value = value
    // 将之前的旧数据赋值回来
    formData.value = { ...initData, ...recordFormData[value] }
  }
}

/** 提交写作 */
const submit = () => {
  if (selectedTab.value === 2 && !formData.value.originalContent) {
    message.warning('请输入原文')
    return
  }
  if (!formData.value.prompt) {
    message.warning(`请输入${selectedTab.value === 1 ? '写作' : '回复'}内容`)
    return
  }
  emits('submit', {
    /** 撰写的时候没有 originalContent 字段**/
    ...(selectedTab.value === 1 ? omit(formData.value, ['originalContent']) : formData.value),
    /** 使用选中 tab 值覆盖当前的 type 类型 **/
    type: selectedTab.value
  })
}
</script>
