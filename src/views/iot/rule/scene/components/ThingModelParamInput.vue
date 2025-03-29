<template>
  <div class="flex items-center">
    <!-- 数值类型输入框 -->
    <template v-if="isNumeric">
      <el-input
        v-model="value"
        class="w-1/1!"
        :placeholder="`请输入${dataSpecs.unitName ? dataSpecs.unitName : '数值'}`"
      >
        <template #append> {{ dataSpecs.unit }} </template>
      </el-input>
    </template>

    <!-- 布尔类型使用开关 -->
    <template v-else-if="isBool">
      <el-switch
        v-model="value"
        size="large"
        :active-text="dataSpecsList[1].name"
        :active-value="dataSpecsList[1].value"
        :inactive-text="dataSpecsList[0].name"
        :inactive-value="dataSpecsList[0].value"
      />
    </template>

    <!-- 枚举类型使用下拉选择 -->
    <template v-else-if="isEnum">
      <el-select class="w-1/1!" v-model="value">
        <el-option
          v-for="(item, index) in dataSpecsList"
          :key="index"
          :label="item.name"
          :value="item.value"
        />
      </el-select>
    </template>

    <!-- 时间类型使用时间选择器 -->
    <template v-else-if="isDate">
      <el-date-picker
        class="w-1/1!"
        v-model="value"
        type="datetime"
        value-format="YYYY-MM-DD HH:mm:ss"
        placeholder="选择日期时间"
      />
    </template>

    <!-- 文本类型使用文本输入框 -->
    <template v-else-if="isText">
      <el-input
        class="w-1/1!"
        v-model="value"
        :maxlength="dataSpecs?.length"
        :show-word-limit="true"
        placeholder="请输入文本"
      />
    </template>

    <!-- array、struct 直接输入 -->
    <template v-else>
      <el-input class="w-1/1!" :model-value="value" disabled placeholder="请输入值">
        <template #append>
          <el-button type="primary" @click="openJsonEditor">编辑</el-button>
        </template>
      </el-input>
      <!-- array、struct 类型数据编辑 -->
      <ThingModelDualView
        ref="thingModelDualViewRef"
        v-model="value"
        :thing-model="dataSpecsList"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType } from '@/views/iot/thingmodel/config'
import ThingModelDualView from './ThingModelDualView.vue'

/** 物模型属性参数输入组件 */
defineOptions({ name: 'ThingModelParamInput' })

const props = defineProps<{
  modelValue: any // 物模型的值
  thingModel: any // 物模型
}>()

const emits = defineEmits(['update:modelValue', 'change'])
const value = useVModel(props, 'modelValue', emits)

const thingModelDualViewRef = ref<InstanceType<typeof ThingModelDualView>>()
const openJsonEditor = () => {
  thingModelDualViewRef.value?.open()
}

/** 计算属性：判断数据类型 */
const isNumeric = computed(() =>
  [DataSpecsDataType.INT, DataSpecsDataType.FLOAT, DataSpecsDataType.DOUBLE].includes(
    props.thingModel?.dataType as any
  )
)
const isBool = computed(() => props.thingModel?.dataType === DataSpecsDataType.BOOL)
const isEnum = computed(() => props.thingModel?.dataType === DataSpecsDataType.ENUM)
const isDate = computed(() => props.thingModel?.dataType === DataSpecsDataType.DATE)
const isText = computed(() => props.thingModel?.dataType === DataSpecsDataType.TEXT)
/** 获取数据规格 */
const dataSpecs = computed(() => {
  if (isNumeric.value || isDate.value || isText.value) {
    return props.thingModel?.dataSpecs || {}
  }
  return {}
})
const dataSpecsList = computed(() => {
  if (
    isBool.value ||
    isEnum.value ||
    [DataSpecsDataType.ARRAY, DataSpecsDataType.STRUCT].includes(props.thingModel?.dataType)
  ) {
    return props.thingModel?.dataSpecsList || []
  }
  return []
})

/** 物模型切换重置值 */
watch(
  () => props.thingModel?.dataType,
  (_, oldValue) => {
    if (!oldValue) {
      return
    }
    value.value = undefined
  },
  { deep: true }
)
</script>
