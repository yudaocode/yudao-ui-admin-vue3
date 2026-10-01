<template>
  <el-form-item label="主机地址" prop="config.host">
    <el-input v-model="config.host" placeholder="请输入主机地址，如：localhost" />
  </el-form-item>
  <el-form-item label="端口" prop="config.port">
    <el-input-number
      v-model="config.port"
      :max="65535"
      :min="1"
      controls-position="right"
      placeholder="请输入端口"
    />
  </el-form-item>
  <el-form-item label="密码" prop="config.password">
    <el-input v-model="config.password" placeholder="请输入密码" show-password type="password" />
  </el-form-item>
  <el-form-item label="数据库" prop="config.database">
    <el-input-number
      v-model="config.database"
      :max="15"
      :min="0"
      controls-position="right"
      placeholder="请输入数据库索引"
    />
  </el-form-item>
  <el-form-item label="主题" prop="config.topic">
    <el-input v-model="config.topic" placeholder="请输入主题" />
  </el-form-item>
  <el-form-item label="数据结构" prop="config.dataStructure">
    <el-select v-model="config.dataStructure" placeholder="请选择数据结构" class="w-1/1">
      <el-option
        v-for="item in IOT_REDIS_DATA_STRUCTURE_OPTIONS"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-form-item>
  <el-form-item
    v-if="config.dataStructure === IotRedisDataStructureEnum.HASH"
    label="Hash 字段"
    prop="config.hashField"
  >
    <el-input v-model="config.hashField" placeholder="留空时使用设备 ID" />
  </el-form-item>
  <el-form-item
    v-if="config.dataStructure === IotRedisDataStructureEnum.ZSET"
    label="Score 字段"
    prop="config.scoreField"
  >
    <el-input v-model="config.scoreField" placeholder="留空时使用当前时间戳" />
  </el-form-item>
</template>
<script lang="ts" setup>
import { IotDataSinkTypeEnum, RedisStreamMQConfig } from '@/api/iot/rule/data/sink'
import {
  IOT_REDIS_DATA_STRUCTURE_OPTIONS,
  IotRedisDataStructureEnum
} from '@/views/iot/utils/constants'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'RedisStreamMQConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<RedisStreamMQConfig>

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    config.value.dataStructure ??= IotRedisDataStructureEnum.STREAM
    return
  }
  config.value = {
    type: IotDataSinkTypeEnum.REDIS_STREAM + '', // 序列化成对应类型时使用
    host: '',
    port: 6379,
    password: '',
    database: 0,
    dataStructure: IotRedisDataStructureEnum.STREAM,
    topic: ''
  }
})
</script>
