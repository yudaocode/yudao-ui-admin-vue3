<template>
  <el-select v-model="channelId" class="!w-full">
    <el-option v-for="c in channelList" :key="c.id" :label="c.name" :value="c.id" />
  </el-select>
</template>

<script lang="ts" setup>
import * as ChannelApi from '@/api/im/manager/channel'

/** 频道下拉选择 **/
defineOptions({ name: 'ImChannelSelect' })

const props = defineProps({
  modelValue: { type: Number, default: undefined }
})
const emit = defineEmits(['update:modelValue'])

const channelId = computed({
  get: () => props.modelValue,
  set: (val: any) => emit('update:modelValue', val)
})

const channelList = ref<ChannelApi.ImManagerChannelVO[]>([])

const getList = async () => {
  channelList.value = await ChannelApi.getSimpleChannelList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
