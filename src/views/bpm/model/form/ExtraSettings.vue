<template>
  <el-form ref="formRef" :model="modelData" label-width="120px" class="mt-20px">
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">提交人权限</el-text>
      </template>
      <div class="flex flex-col">
        <el-checkbox v-model="modelData.allowCancelRunningProcess" label="允许撤销审批中的申请" />
        <div class="ml-22px">
          <el-text type="info"> 第一个审批节点通过后，提交人仍可撤销申请 </el-text>
        </div>
      </div>
    </el-form-item>
    <el-form-item v-if="modelData.processIdRule" class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">流程编码</el-text>
      </template>
      <div class="flex flex-col">
        <div>
          <el-input
            v-model="modelData.processIdRule.prefix"
            class="w-130px!"
            placeholder="前缀"
            :disabled="!modelData.processIdRule.enable"
          >
            <template #prepend>
              <el-checkbox v-model="modelData.processIdRule.enable" />
            </template>
          </el-input>
          <el-select
            v-model="modelData.processIdRule.infix"
            class="w-130px! ml-5px"
            placeholder="中缀"
            :disabled="!modelData.processIdRule.enable"
          >
            <el-option
              v-for="item in timeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-model="modelData.processIdRule.postfix"
            class="w-80px! ml-5px"
            placeholder="后缀"
            :disabled="!modelData.processIdRule.enable"
          />
          <el-input-number
            v-model="modelData.processIdRule.length"
            class="w-120px! ml-5px"
            :min="5"
            :disabled="!modelData.processIdRule.enable"
          />
        </div>
        <div class="ml-22px" v-if="modelData.processIdRule.enable">
          <el-text type="info"> 编码示例：{{ numberExample }} </el-text>
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const modelData = defineModel<any>()

const timeOptions = ref([
  {
    value: 'NULL',
    label: '无'
  },
  {
    value: 'DAY',
    label: '精确到日'
  },
  {
    value: 'HOUR',
    label: '精确到时'
  },
  {
    value: 'MINUTE',
    label: '精确到分'
  },
  {
    value: 'SECOND',
    label: '精确到秒'
  }
])

const numberExample = computed(() => {
  if (modelData.value.processIdRule.enable) {
    let infix = ''
    switch (modelData.value.processIdRule.infix) {
      case 'DAY':
        infix = dayjs().format('YYYYMMDD')
        break
      case 'HOUR':
        infix = dayjs().format('YYYYMMDDHH')
        break
      case 'MINUTE':
        infix = dayjs().format('YYYYMMDDHHmm')
        break
      case 'SECOND':
        infix = dayjs().format('YYYYMMDDHHmmss')
        break
      default:
        break
    }
    return (
      modelData.value.processIdRule.prefix +
      infix +
      modelData.value.processIdRule.postfix +
      '1'.padStart(modelData.value.processIdRule.length - 1, '0')
    )
  } else {
    return ''
  }
})

/** 兼容以前未配置更多设置的流程 */
const initData = () => {
  if (!modelData.value.processIdRule) {
    modelData.value.processIdRule = {
      enable: false,
      prefix: '',
      infix: '',
      postfix: '',
      length: 5
    }
  }
}
defineExpose({ initData })
</script>
