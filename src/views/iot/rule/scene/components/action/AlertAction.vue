<template>
  <div class="bg-[#dbe5f6] p-10px">
    <div class="flex items-center mb-10px">
      <span class="mr-10px w-80px">接收方式</span>
      <el-select
        v-model="alertConfig.receiveType"
        class="!w-160px"
        clearable
        placeholder="选择接收方式"
      >
        <el-option 
          v-for="(value, key) in IotAlertConfigReceiveTypeEnum"
          :key="value"
          :label="key === 'SMS' ? '短信' : key === 'MAIL' ? '邮箱' : '通知'"
          :value="value"
        />
      </el-select>
    </div>
    <div v-if="alertConfig.receiveType === IotAlertConfigReceiveTypeEnum.SMS" class="flex items-center mb-10px">
      <span class="mr-10px w-80px">手机号码</span>
      <el-select
        v-model="alertConfig.phoneNumbers"
        class="!w-360px"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="请输入手机号码"
      />
    </div>
    <div v-if="alertConfig.receiveType === IotAlertConfigReceiveTypeEnum.MAIL" class="flex items-center mb-10px">
      <span class="mr-10px w-80px">邮箱地址</span>
      <el-select
        v-model="alertConfig.emails"
        class="!w-360px"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="请输入邮箱地址"
      />
    </div>
    <div class="flex items-center">
      <span class="mr-10px w-80px align-self-start">通知内容</span>
      <el-input
        v-model="alertConfig.content"
        type="textarea"
        :rows="4"
        class="!w-360px"
        placeholder="请输入通知内容"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { ActionAlert, IotAlertConfigReceiveTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 告警执行器组件 */
defineOptions({ name: 'AlertAction' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const alertConfig = useVModel(props, 'modelValue', emits) as Ref<ActionAlert>

/** 初始化告警执行器结构 */
const initAlertConfig = () => {
  if (!alertConfig.value) {
    alertConfig.value = {
      receiveType: IotAlertConfigReceiveTypeEnum.NOTIFY,
      phoneNumbers: [],
      emails: [],
      content: ''
    } as ActionAlert
  }
}

/** 初始化 */
onMounted(() => {
  initAlertConfig()
})
</script> 
