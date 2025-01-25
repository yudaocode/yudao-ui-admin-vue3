<template>
  <el-form-item label="请求头">
    <div class="flex pt-2" v-for="(item, index) in props.header" :key="index">
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.header.${index}.key`"
          :rules="{
            required: true,
            message: '参数名不能为空',
            trigger: 'blur'
          }"
        >
          <el-input class="w-160px" v-model="item.key" />
        </el-form-item>
      </div>
      <div class="mr-2">
        <el-select class="w-100px!" v-model="item.type">
          <el-option
            v-for="types in LISTENER_MAP_TYPES"
            :key="types.value"
            :label="types.label"
            :value="types.value"
          />
        </el-select>
      </div>
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.header.${index}.value`"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: 'blur'
          }"
        >
          <el-input
            v-if="item.type === ListenerParamTypeEnum.FIXED_VALUE"
            class="w-160px"
            v-model="item.value"
          />
        </el-form-item>
        <el-form-item
          :prop="`${bind}.header.${index}.value`"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: 'change'
          }"
        >
          <el-select
            v-if="item.type === ListenerParamTypeEnum.FROM_FORM"
            class="w-160px!"
            v-model="item.value"
          >
            <el-option
              v-for="(field, fIdx) in formFieldOptions"
              :key="fIdx"
              :label="field.title"
              :value="field.field"
              :disabled="!field.required"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="mr-1 flex items-center">
        <Icon icon="ep:delete" :size="18" @click="deleteHttpRequestParam(props.header, index)" />
      </div>
    </div>
    <el-button type="primary" text @click="addHttpRequestParam(props.header)">
      <Icon icon="ep:plus" class="mr-5px" />添加一行
    </el-button>
  </el-form-item>
  <el-form-item label="请求体">
    <div class="flex pt-2" v-for="(item, index) in props.body" :key="index">
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.body.${index}.key`"
          :rules="{
            required: true,
            message: '参数名不能为空',
            trigger: 'blur'
          }"
        >
          <el-input class="w-160px" v-model="item.key" />
        </el-form-item>
      </div>
      <div class="mr-2">
        <el-select class="w-100px!" v-model="item.type">
          <el-option
            v-for="types in LISTENER_MAP_TYPES"
            :key="types.value"
            :label="types.label"
            :value="types.value"
          />
        </el-select>
      </div>
      <div class="mr-2">
        <el-form-item
          :prop="`${bind}.body.${index}.value`"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: 'blur'
          }"
        >
          <el-input
            v-if="item.type === ListenerParamTypeEnum.FIXED_VALUE"
            class="w-160px"
            v-model="item.value"
          />
        </el-form-item>
        <el-form-item
          :prop="`${bind}.body.${index}.value`"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: 'change'
          }"
        >
          <el-select
            v-if="item.type === ListenerParamTypeEnum.FROM_FORM"
            class="w-160px!"
            v-model="item.value"
          >
            <el-option
              v-for="(field, fIdx) in formFieldOptions"
              :key="fIdx"
              :label="field.title"
              :value="field.field"
              :disabled="!field.required"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="mr-1 flex items-center">
        <Icon icon="ep:delete" :size="18" @click="deleteHttpRequestParam(props.body, index)" />
      </div>
    </div>
    <el-button type="primary" text @click="addHttpRequestParam(props.body)">
      <Icon icon="ep:plus" class="mr-5px" />添加一行
    </el-button>
  </el-form-item>
</template>
<script setup lang="ts">
import { ListenerParam, LISTENER_MAP_TYPES, ListenerParamTypeEnum } from '../../consts'
import { useFormFields } from '../../node'
defineOptions({
  name: 'HttpRequestParamSetting'
})

const props = defineProps({
  header: {
    type: Array as () => ListenerParam[],
    required: false,
    default: () => []
  },
  body: {
    type: Array as () => ListenerParam[],
    required: false,
    default: () => []
  },
  bind: {
    type: String,
    required: true
  }
})

const formFieldOptions = useFormFields()

const addHttpRequestParam = (arr: ListenerParam[]) => {
  arr.push({
    key: '',
    type: ListenerParamTypeEnum.FIXED_VALUE,
    value: ''
  })
}
const deleteHttpRequestParam = (arr: ListenerParam[], index: number) => {
  arr.splice(index, 1)
}
</script>

<style lang="scss" scoped></style>
