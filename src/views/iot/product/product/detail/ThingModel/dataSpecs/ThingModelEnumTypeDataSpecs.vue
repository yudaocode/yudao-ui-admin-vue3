<template>
  <el-form-item label="枚举项" prop="enum">
    <div class="flex flex-col">
      <div class="flex items-center">
        <span class="flex-1"> 参数值 </span>
        <span class="flex-1"> 参数描述 </span>
      </div>
      <div
        v-for="(item, index) in dataSpecsList"
        :key="index"
        class="flex items-center justify-between mb-5px"
      >
        <el-input v-model="item.value" placeholder="请输入枚举值,如'0'" />
        <span class="mx-2">~</span>
        <el-input v-model="item.name" placeholder="对该枚举项的描述" />
        <el-button link type="primary" class="ml-10px" @click="deleteEnum(index)">删除</el-button>
      </div>
      <el-button link type="primary" @click="addEnum">+添加枚举项</el-button>
    </div>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import {
  DataSpecsDataType,
  DataSpecsEnumOrBoolDataVO
} from '@/views/iot/product/product/detail/ThingModel/config'

/** 枚举型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelEnumTypeDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataSpecsList = useVModel(props, 'modelValue', emits) as Ref<DataSpecsEnumOrBoolDataVO[]>
const message = useMessage()

/** 添加枚举项 */
const addEnum = () => {
  dataSpecsList.value.push({
    dataType: DataSpecsDataType.ENUM,
    name: '', // 枚举项的名称
    value: undefined // 枚举值
  })
}

/** 删除枚举项 */
const deleteEnum = (index: number) => {
  if (dataSpecsList.value.length === 1) {
    message.warning('至少需要一个枚举项')
    return
  }
  dataSpecsList.value.splice(index, 1)
}
</script>

<style lang="scss" scoped></style>
