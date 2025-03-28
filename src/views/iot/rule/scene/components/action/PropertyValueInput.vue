<template>
  <div class="property-value-input">
    <!-- 文本类型 -->
    <template v-if="dataType === 'text'">
      <el-input
        v-model="inputValue"
        class="!w-240px"
        :placeholder="`请输入${dataSpecs?.name || '值'}`"
      >
        <template v-if="dataSpecs?.unitName" #append>{{ dataSpecs.unitName }}</template>
      </el-input>
    </template>

    <!-- 数值类型 -->
    <template v-else-if="['int', 'float', 'double'].includes(dataType)">
      <el-input-number
        v-model="inputValue"
        class="!w-240px"
        :min="dataSpecs?.min"
        :max="dataSpecs?.max"
        :precision="dataType === 'int' ? 0 : 2"
        :step="dataType === 'int' ? 1 : 0.1"
        :placeholder="`请输入${dataSpecs?.name || '值'}`"
      />
      <span v-if="dataSpecs?.unitName" class="ml-5px">{{ dataSpecs.unitName }}</span>
    </template>

    <!-- 枚举类型 -->
    <template v-else-if="dataType === 'enum'">
      <el-select
        v-model="inputValue"
        class="!w-240px"
        clearable
        :placeholder="`请选择${dataSpecs?.name || '值'}`"
      >
        <el-option
          v-for="item in dataSpecs?.enumList"
          :key="item.value"
          :label="item.text"
          :value="item.value"
        />
      </el-select>
    </template>

    <!-- 布尔类型 -->
    <template v-else-if="dataType === 'bool'">
      <el-radio-group v-model="inputValue">
        <el-radio
          v-for="item in [
            { value: true, label: dataSpecs?.trueText || '是' },
            { value: false, label: dataSpecs?.falseText || '否' }
          ]"
          :key="String(item.value)"
          :label="item.value"
        >
          {{ item.label }}
        </el-radio>
      </el-radio-group>
    </template>

    <!-- 日期类型 -->
    <template v-else-if="dataType === 'date'">
      <el-date-picker
        v-model="inputValue"
        class="!w-240px"
        type="datetime"
        :placeholder="`请选择${dataSpecs?.name || '日期'}`"
      />
    </template>

    <!-- 结构体类型 -->
    <template v-else-if="dataType === 'struct'">
      <el-collapse class="w-full">
        <el-collapse-item title="结构体参数">
          <div
            v-for="field in dataSpecs?.specs"
            :key="field.identifier"
            class="flex items-center mb-10px"
          >
            <span class="mr-10px inline-block min-w-80px">{{ field.name }}</span>
            <PropertyValueInput
              :model-value="getStructFieldValue(field.identifier)"
              :data-specs="field"
              @update:model-value="(val) => updateStructField(field.identifier, val)"
            />
          </div>
        </el-collapse-item>
      </el-collapse>
    </template>

    <!-- 数组类型 -->
    <template v-else-if="dataType === 'array'">
      <div class="flex flex-col w-full">
        <div v-for="(item, index) in arrayValue" :key="index" class="flex items-center mb-10px">
          <PropertyValueInput
            :model-value="item"
            :data-specs="dataSpecs?.arrayInfo"
            @update:model-value="(val) => updateArrayItem(index, val)"
          />
          <el-button
            type="danger"
            size="small"
            circle
            class="ml-10px"
            @click="removeArrayItem(index)"
          >
            <Icon icon="ep:delete" />
          </el-button>
        </div>
        <el-button type="primary" size="small" plain @click="addArrayItem">添加项</el-button>
      </div>
    </template>

    <!-- 默认文本输入 -->
    <template v-else>
      <el-input
        v-model="inputValue"
        class="!w-240px"
        :placeholder="`请输入${dataSpecs?.name || '值'}`"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 属性值输入组件 */
defineOptions({ name: 'PropertyValueInput' })

const props = defineProps<{
  modelValue: any
  dataSpecs: any
}>()

const emits = defineEmits(['update:modelValue'])

// 获取数据类型
const dataType = computed(() => {
  return props.dataSpecs?.dataType
})

// 基本类型的输入值
const inputValue = computed({
  get: () => {
    // 对于日期类型，如果是字符串需要转换为日期对象
    if (dataType.value === 'date' && typeof props.modelValue === 'string') {
      return new Date(props.modelValue)
    }
    return props.modelValue
  },
  set: (value) => {
    // 对于日期类型，需要转换为ISO字符串
    if (dataType.value === 'date' && value instanceof Date) {
      emits('update:modelValue', value.toISOString())
      return
    }
    emits('update:modelValue', value)
  }
})

// 结构体类型处理
const structValue = computed({
  get: () => {
    return props.modelValue || {}
  },
  set: (value) => {
    emits('update:modelValue', value)
  }
})

// 获取结构体字段值
const getStructFieldValue = (identifier: string) => {
  return structValue.value[identifier]
}

// 更新结构体字段
const updateStructField = (identifier: string, value: any) => {
  const newStruct = { ...structValue.value }
  newStruct[identifier] = value
  structValue.value = newStruct
}

// 数组类型处理
const arrayValue = computed({
  get: () => {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  },
  set: (value) => {
    emits('update:modelValue', value)
  }
})

// 添加数组项
const addArrayItem = () => {
  const newArray = [...arrayValue.value]
  // 根据数组元素类型创建默认值
  const arrayItemType = props.dataSpecs?.arrayInfo?.dataType
  let defaultValue = null
  switch (arrayItemType) {
    case 'int':
    case 'float':
    case 'double':
      defaultValue = 0
      break
    case 'bool':
      defaultValue = false
      break
    case 'text':
      defaultValue = ''
      break
    case 'struct':
      defaultValue = {}
      break
    case 'array':
      defaultValue = []
      break
  }
  newArray.push(defaultValue)
  arrayValue.value = newArray
}

// 更新数组项
const updateArrayItem = (index: number, value: any) => {
  const newArray = [...arrayValue.value]
  newArray[index] = value
  arrayValue.value = newArray
}

// 移除数组项
const removeArrayItem = (index: number) => {
  const newArray = [...arrayValue.value]
  newArray.splice(index, 1)
  arrayValue.value = newArray
}
</script>

<style scoped lang="scss"></style>
