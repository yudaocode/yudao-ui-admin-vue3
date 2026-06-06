<template>
  <el-select v-model="materialId" :disabled="!channelId" class="!w-full">
    <el-option v-for="m in materialList" :key="m.id" :label="m.title" :value="m.id" />
  </el-select>
</template>

<script lang="ts" setup>
import * as MaterialApi from '@/api/im/manager/channel/material'

/** 素材下拉选择；按 channelId 联动 */
defineOptions({ name: 'ImMaterialSelect' })

const props = defineProps({
  modelValue: { type: Number, default: undefined },
  channelId: { type: Number, default: undefined }
})
const emit = defineEmits(['update:modelValue'])

const materialId = computed({
  get: () => props.modelValue,
  set: (val: any) => emit('update:modelValue', val)
})

const materialList = ref<MaterialApi.ImManagerChannelMaterialVO[]>([])

/** 切换频道时拉取该频道下的素材 */
watch(
  () => props.channelId,
  async (id) => {
    emit('update:modelValue', undefined)
    materialList.value = id ? await MaterialApi.getSimpleManagerChannelMaterialList(id) : []
  },
  { immediate: true }
)
</script>
