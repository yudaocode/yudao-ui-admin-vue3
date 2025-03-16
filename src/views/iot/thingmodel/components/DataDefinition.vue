<template>
  <!-- 属性 -->
  <template v-if="data.type === ThingModelType.PROPERTY">
    <!-- 非列表型：数值 -->
    <div
      v-if="
        [DataSpecsDataType.INT, DataSpecsDataType.DOUBLE, DataSpecsDataType.FLOAT].includes(
          data.property.dataType
        )
      "
    >
      取值范围：{{ `${data.property.dataSpecs.min}~${data.property.dataSpecs.max}` }}
    </div>
    <!-- 非列表型：文本 -->
    <div v-if="DataSpecsDataType.TEXT === data.property.dataType">
      数据长度：{{ data.property.dataSpecs.length }}
    </div>
    <!-- 列表型: 数组、结构、时间（特殊） -->
    <div
      v-if="
        [DataSpecsDataType.ARRAY, DataSpecsDataType.STRUCT, DataSpecsDataType.DATE].includes(
          data.property.dataType
        )
      "
    >
      -
    </div>
    <!-- 列表型: 布尔值、枚举 -->
    <div v-if="[DataSpecsDataType.BOOL, DataSpecsDataType.ENUM].includes(data.property.dataType)">
      <div> {{ DataSpecsDataType.BOOL === data.property.dataType ? '布尔值' : '枚举值' }}：</div>
      <div v-for="item in data.property.dataSpecsList" :key="item.value">
        {{ `${item.name}-${item.value}` }}
      </div>
    </div>
  </template>
  <!-- 服务 -->
  <div v-if="data.type === ThingModelType.SERVICE">
    调用方式：{{ getCallTypeByValue(data.service!.callType) }}
  </div>
  <!-- 事件 -->
  <div v-if="data.type === ThingModelType.EVENT">
    事件类型：{{ getEventTypeByValue(data.event!.type) }}
  </div>
</template>

<script lang="ts" setup>
import {
  DataSpecsDataType,
  getCallTypeByValue,
  getEventTypeByValue,
  ThingModelType
} from '@/views/iot/thingmodel/config'
import { ThingModelData } from '@/api/iot/thingmodel'

/** 数据定义展示组件 */
defineOptions({ name: 'DataDefinition' })

defineProps<{ data: ThingModelData }>()
</script>

<style lang="scss" scoped></style>
