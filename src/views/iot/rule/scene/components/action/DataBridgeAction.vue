<template>
  <div class="bg-[#dbe5f6] p-10px">
    <div class="flex items-center">
      <span class="mr-10px w-80px">数据流转目的</span>
      <el-select v-model="dataBridgeId" class="!w-240px" clearable placeholder="选择数据流转目的">
        <el-option
          v-for="bridge in dataSinkList"
          :key="bridge.id"
          :label="bridge.name"
          :value="bridge.id"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { DataSinkApi } from '@/api/iot/rule/data/sink'

/** 数据流转目的执行器组件 */
defineOptions({ name: 'DataBridgeAction' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataBridgeId = useVModel(props, 'modelValue', emits)

const dataSinkList = ref<any[]>([]) // 数据流转目的列表

onMounted(async () => {
  // 获取数据流转目的列表
  dataSinkList.value = await DataSinkApi.getDataSinkSimpleList()
})
</script>
