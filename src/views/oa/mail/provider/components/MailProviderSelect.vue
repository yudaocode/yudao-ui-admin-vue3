<template>
  <!-- 邮箱服务选择 -->
  <el-select
    v-model="selectValue"
    :disabled="disabled"
    :clearable="clearable"
    placeholder="请选择邮箱服务"
    filterable
    class="w-full"
  >
    <el-option v-for="item in list" :key="item.id" :label="item.name" :value="item.id!" />
  </el-select>
</template>

<script setup lang="ts">
import * as ProviderApi from '@/api/oa/mail/provider'

defineOptions({ name: 'OaMailProviderSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
  }>(),
  { disabled: false, clearable: true }
)
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()
const list = ref<ProviderApi.MailProviderVO[]>([]) // 启用的邮箱服务配置
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 初始化 */
onMounted(async () => {
  list.value = await ProviderApi.getSimpleMailProviderList()
})
</script>
