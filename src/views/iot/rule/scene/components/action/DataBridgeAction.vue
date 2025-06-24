<template>
  <div class="bg-[#dbe5f6] p-10px">
    <div class="flex items-center">
      <span class="mr-10px w-80px">数据流转目的</span>
      <el-select v-model="dataBridgeId" class="!w-240px" clearable placeholder="选择数据流转目的">
        <el-option
          v-for="bridge in dataBridgeList"
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

const dataBridgeList = ref<any[]>([]) // 数据流转目的列表

/** 获取数据流转目的列表 */
const getDataBridgeList = async () => {
  dataBridgeList.value = await DataSinkApi.getDataSinkSimpleList()
}

onMounted(() => {
  getDataBridgeList()
})
</script>
