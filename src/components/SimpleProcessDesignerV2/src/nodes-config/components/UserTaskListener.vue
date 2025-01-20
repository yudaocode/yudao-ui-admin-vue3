<template>
  <el-form ref="listenerFormRef" :model="configForm" label-position="top">
    <div v-for="(listener, listenerIdx) in taskListener" :key="listenerIdx">
      <el-divider content-position="left">
        <el-text tag="b" size="large">{{ listener.name }}</el-text>
      </el-divider>
      <el-form-item>
        <el-switch
          v-model="configForm[`task${listener.type}ListenerEnable`]"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>
      <div v-if="configForm[`task${listener.type}ListenerEnable`]">
        <el-form-item>
          <el-alert
            title="仅支持 POST 请求，以请求体方式接收参数"
            type="warning"
            show-icon
            :closable="false"
          />
        </el-form-item>
        <el-form-item
          label="请求地址"
          :prop="`task${listener.type}ListenerPath`"
          :rules="{
            required: true,
            message: '请求地址不能为空',
            trigger: 'blur'
          }"
        >
          <el-input v-model="configForm[`task${listener.type}ListenerPath`]" />
        </el-form-item>
        <el-form-item label="请求头">
          <div
            class="flex pt-2"
            v-for="(item, index) in configForm[`task${listener.type}ListenerHeader`]"
            :key="index"
          >
            <div class="mr-2">
              <el-form-item
                :prop="`task${listener.type}ListenerHeader.${index}.key`"
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
                :prop="`task${listener.type}ListenerHeader.${index}.value`"
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
                :prop="`task${listener.type}ListenerHeader.${index}.value`"
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
              <Icon
                icon="ep:delete"
                :size="18"
                @click="
                  deleteTaskListenerParam(configForm[`task${listener.type}ListenerHeader`], index)
                "
              />
            </div>
          </div>
          <el-button
            type="primary"
            text
            @click="addTaskListenerParam(configForm[`task${listener.type}ListenerHeader`])"
          >
            <Icon icon="ep:plus" class="mr-5px" />添加一行
          </el-button>
        </el-form-item>
        <el-form-item label="请求体">
          <div
            class="flex pt-2"
            v-for="(item, index) in configForm[`task${listener.type}ListenerBody`]"
            :key="index"
          >
            <div class="mr-2">
              <el-form-item
                :prop="`task${listener.type}ListenerBody.${index}.key`"
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
                :prop="`task${listener.type}ListenerBody.${index}.value`"
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
                :prop="`task${listener.type}ListenerBody.${index}.value`"
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
              <Icon
                icon="ep:delete"
                :size="18"
                @click="
                  deleteTaskListenerParam(configForm[`task${listener.type}ListenerBody`], index)
                "
              />
            </div>
          </div>
          <el-button
            type="primary"
            text
            @click="addTaskListenerParam(configForm[`task${listener.type}ListenerBody`])"
          >
            <Icon icon="ep:plus" class="mr-5px" />添加一行
          </el-button>
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { LISTENER_MAP_TYPES, ListenerParamTypeEnum } from '../../consts'
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  formFieldOptions: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['update:modelValue'])
const listenerFormRef = ref()
const configForm = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  }
})
const taskListener = ref([
  {
    name: '创建任务',
    type: 'Create'
  },
  {
    name: '指派任务执行人员',
    type: 'Assign'
  },
  {
    name: '完成任务',
    type: 'Complete'
  }
])

const addTaskListenerParam = (arr) => {
  arr.push({
    key: '',
    type: 1,
    value: ''
  })
}
const deleteTaskListenerParam = (arr, index) => {
  arr.splice(index, 1)
}

const validate = async () => {
  if (!listenerFormRef) return false
  return await listenerFormRef.value.validate()
}

defineExpose({ validate })
</script>
