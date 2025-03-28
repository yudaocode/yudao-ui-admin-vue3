<template>
  <div class="bg-[#dbe5f6] p-10px">
    <div class="flex items-center">
      <span class="mr-10px w-80px">数据桥接</span>
      <el-select
        v-model="dataBridgeId"
        class="!w-240px"
        clearable
        placeholder="选择数据桥接"
      >
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

/** 数据桥接执行器组件 */
defineOptions({ name: 'DataBridgeAction' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataBridgeId = useVModel(props, 'modelValue', emits)

// 模拟数据桥接列表，实际项目中应该从API获取
const dataBridgeList = ref([
  { id: 1, name: '数据桥接1' },
  { id: 2, name: '数据桥接2' },
  { id: 3, name: '数据桥接3' }
])

// 实际项目中，应该从API获取数据桥接列表
// const getDataBridgeList = async () => {
//   try {
//     dataBridgeList.value = await DataBridgeApi.getSimpleList()
//   } catch (error) {
//     console.error('获取数据桥接列表失败', error)
//   }
// }

// onMounted(() => {
//   getDataBridgeList()
// })
</script> 
