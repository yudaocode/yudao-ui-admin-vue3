<!-- AI 模型选择器 -->
<template>
  <el-select v-bind="$attrs" v-model="selectValue" :placeholder="placeholder" filterable>
    <template v-if="selectedModel" #prefix>
      <el-avatar :size="18" shape="square" :src="selectedModel.iconUrl || undefined">
        <Icon icon="ep:cpu" :size="12" />
      </el-avatar>
    </template>
    <!-- 带简介的选项为两行，放开默认的单行高度 -->
    <el-option
      v-for="item in list"
      :key="item.id"
      :label="item.name"
      :value="item.id"
      class="!h-auto !min-h-34px !py-4px"
    >
      <div class="flex items-center gap-8px overflow-hidden">
        <el-avatar :size="24" shape="square" :src="item.iconUrl || undefined" class="flex-shrink-0">
          <Icon icon="ep:cpu" :size="14" />
        </el-avatar>
        <div class="min-w-0 flex-1 overflow-hidden">
          <div class="truncate leading-18px">{{ item.name }}</div>
          <div
            v-if="item.description"
            class="truncate text-12px leading-16px text-[var(--el-text-color-secondary)]"
            :title="item.description"
          >
            {{ item.description }}
          </div>
        </div>
      </div>
    </el-option>
  </el-select>
</template>
<script lang="ts" setup>
import { ModelApi, ModelVO } from '@/api/ai/model/model'

/** AI 模型选择器 */
defineOptions({ name: 'AiModelSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    type?: number // 模型类型，参见 AiModelTypeEnum
    platform?: string // 模型平台，参见 AiPlatformEnum
    placeholder?: string
  }>(),
  {
    placeholder: '请选择模型'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  loaded: [list: ModelVO[]]
}>()

const list = ref<ModelVO[]>([]) // 模型列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
// 选中的模型
const selectedModel = computed(() => list.value.find((item) => item.id === props.modelValue))

/** 加载模型列表 */
const getList = async () => {
  list.value = await ModelApi.getModelSimpleList(props.type, props.platform)
  emit('loaded', list.value)
}

/** 监听模型类型、平台变化 */
watch(() => [props.type, props.platform], getList, { immediate: true })
</script>
