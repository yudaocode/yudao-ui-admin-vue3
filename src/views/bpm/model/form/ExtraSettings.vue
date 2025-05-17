<template>
  <el-form ref="formRef" :model="modelData" label-width="120px" class="mt-20px">
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.submitterPermissions') }}</el-text>
      </template>
      <div class="flex flex-col">
        <el-checkbox v-model="modelData.allowCancelRunningProcess" label="'bpm.model.form.allowCancelRunning'" />
        <div class="ml-22px">
          <el-text type="info">{{ t('bpm.model.form.cancelRunningTip') }}</el-text>
        </div>
      </div>
    </el-form-item>
    <el-form-item v-if="modelData.processIdRule" class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.processCode') }}</el-text>
      </template>
      <div class="flex flex-col">
        <div>
          <el-input
            v-model="modelData.processIdRule.prefix"
            class="w-130px!"
            :placeholder="t('bpm.model.form.prefix')"
            :disabled="!modelData.processIdRule.enable"
          >
            <template #prepend>
              <el-checkbox v-model="modelData.processIdRule.enable" />
            </template>
          </el-input>
          <el-select
            v-model="modelData.processIdRule.infix"
            class="w-130px! ml-5px"
            :placeholder="t('bpm.model.form.infix')"
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
            :placeholder="t('bpm.model.form.postfix')"
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
          <el-text type="info">{{ t('bpm.model.form.codeExample', { example: numberExample }) }}</el-text>
        </div>
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.autoDeduplicate') }}</el-text>
      </template>
      <div class="flex flex-col">
        <div>
          <el-text>{{ t('bpm.model.form.duplicateApproverTip') }}</el-text>
        </div>
        <el-radio-group v-model="modelData.autoApprovalType">
          <div class="flex flex-col">
            <el-radio :value="0">{{ t('bpm.model.form.noAutoApproval') }}</el-radio>
            <el-radio :value="1">{{ t('bpm.model.form.approveOnce') }}</el-radio>
            <el-radio :value="2">{{ t('bpm.model.form.approveConsecutive') }}</el-radio>
          </div>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="modelData.titleSetting" class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.titleSettings') }}</el-text>
      </template>
      <div class="flex flex-col">
        <el-radio-group v-model="modelData.titleSetting.enable">
          <div class="flex flex-col">
            <el-radio :value="false">
              {{ t('bpm.model.form.systemDefault') }}
              <el-text type="info">{{ t('bpm.model.form.showProcessName') }}</el-text>
            </el-radio>
            <el-radio :value="true">
              {{ t('bpm.model.form.customTitle') }}
              <el-text>
                <el-tooltip content="t('bpm.model.form.insertFieldTip')" effect="light" placement="top">
                  <Icon icon="ep:question-filled" class="ml-5px" />
                </el-tooltip>
              </el-text>
            </el-radio>
          </div>
        </el-radio-group>
        <el-mention
          v-if="modelData.titleSetting.enable"
          v-model="modelData.titleSetting.title"
          type="textarea"
          prefix="{"
          split="}"
          whole
          :options="formFieldOptions4Title"
          :placeholder="t('bpm.model.form.insertFieldPlaceholder')"
          class="w-600px!"
        />
      </div>
    </el-form-item>
    <el-form-item
      v-if="modelData.summarySetting && modelData.formType === BpmModelFormType.NORMAL"
      class="mb-20px"
    >
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.summarySettings') }}</el-text>
      </template>
      <div class="flex flex-col">
        <el-radio-group v-model="modelData.summarySetting.enable">
          <div class="flex flex-col">
            <el-radio :value="false">
              {{ t('bpm.model.form.systemDefault') }}
              <el-text type="info">{{ t('bpm.model.form.showFirstThreeFields') }}</el-text>
            </el-radio>
            <el-radio :value="true">{{ t('bpm.model.form.customSummary') }}</el-radio>
          </div>
        </el-radio-group>
        <el-select
          class="w-500px!"
          v-if="modelData.summarySetting.enable"
          v-model="modelData.summarySetting.summary"
          multiple
          :placeholder="t('bpm.model.form.selectDisplayFields')"
        >
          <el-option
            v-for="item in formFieldOptions4Summary"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.processPreNotification') }}</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="processBeforeTriggerEnable"
            @change="handleProcessBeforeTriggerEnableChange"
          />
          <div class="ml-80px">{{ t('bpm.model.form.notifyAfterStart') }}</div>
        </div>
        <HttpRequestSetting
          v-if="processBeforeTriggerEnable"
          v-model:setting="modelData.processBeforeTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'processBeforeTriggerSetting'"
        />
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.processPostNotification') }}</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="processAfterTriggerEnable"
            @change="handleProcessAfterTriggerEnableChange"
          />
          <div class="ml-80px">{{ t('bpm.model.form.notifyAfterEnd') }}</div>
        </div>
        <HttpRequestSetting
          v-if="processAfterTriggerEnable"
          v-model:setting="modelData.processAfterTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'processAfterTriggerSetting'"
        />
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.taskPreNotification') }}</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="taskBeforeTriggerEnable"
            @change="handleTaskBeforeTriggerEnableChange"
          />
          <div class="ml-80px">{{ t('bpm.model.form.notifyDuringTask') }}</div>
        </div>
        <HttpRequestSetting
          v-if="taskBeforeTriggerEnable"
          v-model:setting="modelData.taskBeforeTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'taskBeforeTriggerSetting'"
        />
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">{{ t('bpm.model.form.taskPostNotification') }}</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="taskAfterTriggerEnable"
            @change="handleTaskAfterTriggerEnableChange"
          />
          <div class="ml-80px">{{ t('bpm.model.form.notifyAfterTask') }}</div>
        </div>
        <HttpRequestSetting
          v-if="taskAfterTriggerEnable"
          v-model:setting="modelData.taskAfterTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'taskAfterTriggerSetting'"
        />
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const { t } = useI18n() // Initialize i18n translation function
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { BpmAutoApproveType, BpmModelFormType } from '@/utils/constants'
import * as FormApi from '@/api/bpm/form'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import { ProcessVariableEnum } from '@/components/SimpleProcessDesignerV2/src/consts'
import HttpRequestSetting from '@/components/SimpleProcessDesignerV2/src/nodes-config/components/HttpRequestSetting.vue'

const modelData = defineModel<any>()

/** Time options for process ID code */
const timeOptions = ref([
  {
    value: '',
    label: 'None'
  },
  {
    value: 'DAY',
    label: 'Accurate to day'
  },
  {
    value: 'HOUR',
    label: 'Accurate to hour'
  },
  {
    value: 'MINUTE',
    label: 'Accurate to minute'
  },
  {
    value: 'SECOND',
    label: 'Accurate to second'
  }
])

/** Calculate example number based on process ID rule */
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

/** Process pre-notification trigger enable flag */
const processBeforeTriggerEnable = ref(false)
const handleProcessBeforeTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.processBeforeTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.processBeforeTriggerSetting = null
  }
}

/** Process post-notification trigger enable flag */
const processAfterTriggerEnable = ref(false)
const handleProcessAfterTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.processAfterTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.processAfterTriggerSetting = null
  }
}

/** Task pre-notification trigger enable flag */
const taskBeforeTriggerEnable = ref(false)
const handleTaskBeforeTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.taskBeforeTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.taskBeforeTriggerSetting = null
  }
}

/** Task post-notification trigger enable flag */
const taskAfterTriggerEnable = ref(false)
const handleTaskAfterTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.taskAfterTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.taskAfterTriggerSetting = null
  }
}

/** Form field options */
const formField = ref<Array<{ field: string; title: string }>>([])
const formFieldOptions4Title = computed(() => {
  let cloneFormField = formField.value.map((item) => {
    return {
      label: item.title,
      value: item.field
    }
  })
  // Add fixed process initiator ID field
  cloneFormField.unshift({
    label: 'Process Name',
    value: ProcessVariableEnum.PROCESS_DEFINITION_NAME
  })
  cloneFormField.unshift({
    label: 'Start Time',
    value: ProcessVariableEnum.START_TIME
  })
  cloneFormField.unshift({
    label: 'Initiator',
    value: ProcessVariableEnum.START_USER_ID
  })
  return cloneFormField
})

const formFieldOptions4Summary = computed(() => {
  return formField.value.map((item) => {
    return {
      label: item.title,
      value: item.field
    }
  })
})

/** Initialize data for compatibility with older processes without extra settings */
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
  if (!modelData.value.autoApprovalType) {
    modelData.value.autoApprovalType = BpmAutoApproveType.NONE
  }
  if (!modelData.value.titleSetting) {
    modelData.value.titleSetting = {
      enable: false,
      title: ''
    }
  }
  if (!modelData.value.summarySetting) {
    modelData.value.summarySetting = {
      enable: false,
      summary: []
    }
  }
  if (modelData.value.processBeforeTriggerSetting) {
    processBeforeTriggerEnable.value = true
  }
  if (modelData.value.processAfterTriggerSetting) {
    processAfterTriggerEnable.value = true
  }
  if (modelData.value.taskBeforeTriggerSetting) {
    taskBeforeTriggerEnable.value = true
  }
  if (modelData.value.taskAfterTriggerSetting) {
    taskAfterTriggerEnable.value = true
  }
}
defineExpose({ initData })

/** Watch form ID changes to load form data */
watch(
  () => modelData.value.formId,
  async (newFormId) => {
    if (newFormId && modelData.value.formType === BpmModelFormType.NORMAL) {
      const data = await FormApi.getForm(newFormId)
      const result: Array<{ field: string; title: string }> = []
      if (data.fields) {
        data.fields.forEach((fieldStr: string) => {
          parseFormFields(JSON.parse(fieldStr), result)
        })
      }
      formField.value = result
    } else {
      formField.value = []
    }
  },
  { immediate: true }
)
</script>
