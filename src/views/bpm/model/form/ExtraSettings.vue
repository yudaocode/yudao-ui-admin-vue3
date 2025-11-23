<template>
  <el-form ref="formRef" :model="modelData" label-width="130px" class="mt-20px">
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">提交人权限</el-text>
      </template>
      <div class="flex flex-col">
        <el-checkbox v-model="modelData.allowCancelRunningProcess" label="允许撤销审批中的申请" />
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">审批人权限</el-text>
      </template>
      <div class="flex flex-col">
        <el-checkbox v-model="modelData.allowWithdrawTask" label="允许审批人撤回任务" />
        <div class="ml-22px">
          <el-text type="info"> 审批人可撤回正在审批节点的前一节点 </el-text>
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
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">自动去重</el-text>
      </template>
      <div class="flex flex-col">
        <div>
          <el-text> 同一审批人在流程中重复出现时： </el-text>
        </div>
        <el-radio-group v-model="modelData.autoApprovalType">
          <div class="flex flex-col">
            <el-radio :value="0">不自动通过</el-radio>
            <el-radio :value="1">仅审批一次，后续重复的审批节点均自动通过</el-radio>
            <el-radio :value="2">仅针对连续审批的节点自动通过</el-radio>
          </div>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="modelData.titleSetting" class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">标题设置</el-text>
      </template>
      <div class="flex flex-col">
        <el-radio-group v-model="modelData.titleSetting.enable">
          <div class="flex flex-col">
            <el-radio :value="false"
              >系统默认 <el-text type="info"> 展示流程名称 </el-text></el-radio
            >
            <el-radio :value="true">
              自定义标题
              <el-text>
                <el-tooltip content="输入字符 '{' 即可插入表单字段" effect="light" placement="top">
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
          placeholder="请插入表单字段（输入 '{' 可以选择表单字段）或输入文本"
          class="w-600px!"
        />
      </div>
    </el-form-item>
    <el-form-item
      v-if="modelData.summarySetting && modelData.formType === BpmModelFormType.NORMAL"
      class="mb-20px"
    >
      <template #label>
        <el-text size="large" tag="b">摘要设置</el-text>
      </template>
      <div class="flex flex-col">
        <el-radio-group v-model="modelData.summarySetting.enable">
          <div class="flex flex-col">
            <el-radio :value="false">
              系统默认 <el-text type="info"> 展示表单前 3 个字段 </el-text>
            </el-radio>
            <el-radio :value="true"> 自定义摘要 </el-radio>
          </div>
        </el-radio-group>
        <el-select
          class="w-500px!"
          v-if="modelData.summarySetting.enable"
          v-model="modelData.summarySetting.summary"
          multiple
          placeholder="请选择要展示的表单字段"
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
        <el-text size="large" tag="b">流程前置通知</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="processBeforeTriggerEnable"
            @change="handleProcessBeforeTriggerEnableChange"
          />
          <div class="ml-80px">流程启动后通知</div>
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
        <el-text size="large" tag="b">流程后置通知</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="processAfterTriggerEnable"
            @change="handleProcessAfterTriggerEnableChange"
          />
          <div class="ml-80px">流程结束后通知</div>
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
        <el-text size="large" tag="b">任务前置通知</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="taskBeforeTriggerEnable"
            @change="handleTaskBeforeTriggerEnableChange"
          />
          <div class="ml-80px">任务执行时通知</div>
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
        <el-text size="large" tag="b">任务后置通知</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="taskAfterTriggerEnable"
            @change="handleTaskAfterTriggerEnableChange"
          />
          <div class="ml-80px">任务结束后通知</div>
        </div>
        <HttpRequestSetting
          v-if="taskAfterTriggerEnable"
          v-model:setting="modelData.taskAfterTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'taskAfterTriggerSetting'"
        />
      </div>
    </el-form-item>
    <el-form-item class="mb-20px">
      <template #label>
        <el-text size="large" tag="b">自定义打印模板</el-text>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <el-switch
            v-model="modelData.printTemplateSetting.enable"
            @change="handlePrintTemplateEnableChange"
          />
          <el-button
            v-if="modelData.printTemplateSetting.enable"
            class="ml-80px"
            type="primary"
            link
            @click="handleEditPrintTemplate"
          >
            编辑模板
          </el-button>
        </div>
      </div>
    </el-form-item>
  </el-form>
  <print-template ref="printTemplateRef" @confirm="confirmPrintTemplate" />
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { BpmAutoApproveType, BpmModelFormType } from '@/utils/constants'
import * as FormApi from '@/api/bpm/form'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import { ProcessVariableEnum } from '@/components/SimpleProcessDesignerV2/src/consts'
import HttpRequestSetting from '@/components/SimpleProcessDesignerV2/src/nodes-config/components/HttpRequestSetting.vue'
import PrintTemplate from './PrintTemplate/Index.vue'

const modelData = defineModel<any>()

/** 自定义 ID 流程编码 */
const timeOptions = ref([
  {
    value: '',
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

/** 是否开启流程前置通知 */
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

/** 是否开启流程后置通知 */
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

/** 是否开启任务前置通知 */
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

/** 是否开启任务后置通知 */
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

/** 已解析表单字段 */
const formFields = ref<Array<{ field: string; title: string }>>([])
const formFieldOptions4Title = computed(() => {
  let cloneFormField = formFields.value.map((item) => {
    return {
      label: item.title,
      value: item.field
    }
  })
  // 固定添加发起人 ID 字段
  cloneFormField.unshift({
    label: '流程名称',
    value: ProcessVariableEnum.PROCESS_DEFINITION_NAME
  })
  cloneFormField.unshift({
    label: '发起时间',
    value: ProcessVariableEnum.START_TIME
  })
  cloneFormField.unshift({
    label: '发起人',
    value: ProcessVariableEnum.START_USER_ID
  })
  return cloneFormField
})
const formFieldOptions4Summary = computed(() => {
  return formFields.value.map((item) => {
    return {
      label: item.title,
      value: item.field
    }
  })
})

/** 未解析的表单字段 */
const unParsedFormFields = ref<string[]>([])
/** 暴露给子组件 HttpRequestSetting 使用 */
provide('formFields', unParsedFormFields)
provide('formFieldsObj', formFields)

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
  if (modelData.value.allowWithdrawTask) {
    modelData.value.allowWithdrawTask = false
  }
  if (!modelData.value.printTemplateSetting) {
    modelData.value.printTemplateSetting = {
      enable: false
    }
  }
}
defineExpose({ initData })

/** 监听表单 ID 变化，加载表单数据 */
watch(
  () => modelData.value.formId,
  async (newFormId) => {
    if (newFormId && modelData.value.formType === BpmModelFormType.NORMAL) {
      const data = await FormApi.getForm(newFormId)
      const result: Array<{ field: string; title: string }> = []
      if (data.fields) {
        unParsedFormFields.value = data.fields
        data.fields.forEach((fieldStr: string) => {
          parseFormFields(JSON.parse(fieldStr), result)
        })
      }
      formFields.value = result
    } else {
      formFields.value = []
      unParsedFormFields.value = []
    }
  },
  { immediate: true }
)

const defaultTemplate =
  '<p style="text-align: center;"><span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="流程名称" data-info="%7B%22id%22%3A%22processName%22%7D">@流程名称</span></p><p style="text-align: right;">打印人：<span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="打印人" data-info="%7B%22id%22%3A%22printUser%22%7D">@打印人</span></p><p style="text-align: right;">流程编号：<span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="流程编号" data-info="%7B%22id%22%3A%22processNum%22%7D">@流程编号</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;打印时间：<span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="打印时间" data-info="%7B%22id%22%3A%22printTime%22%7D">@打印时间</span></p><table style="width: 100%;"><tbody><tr><td colSpan="1" rowSpan="1" width="auto">发起人</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="发起人" data-info="%7B%22id%22%3A%22startUser%22%7D">@发起人</span></td><td colSpan="1" rowSpan="1" width="auto">发起时间</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="发起时间" data-info="%7B%22id%22%3A%22startTime%22%7D">@发起时间</span></td></tr><tr><td colSpan="1" rowSpan="1" width="auto">所属部门</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="发起人部门" data-info="%7B%22id%22%3A%22startUserDept%22%7D">@发起人部门</span></td><td colSpan="1" rowSpan="1" width="auto">流程状态</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="流程状态" data-info="%7B%22id%22%3A%22processStatus%22%7D">@流程状态</span></td></tr></tbody></table><p><span data-w-e-type="process-record" data-w-e-is-void data-w-e-is-inline>流程记录</span></p>'
const handlePrintTemplateEnableChange = (val: boolean) => {
  if (val) {
    if (!modelData.value.printTemplateSetting.template) {
      modelData.value.printTemplateSetting.template = defaultTemplate
    }
  }
}
const printTemplateRef = ref()
const handleEditPrintTemplate = () => {
  printTemplateRef.value.open(modelData.value.printTemplateSetting.template)
}
const confirmPrintTemplate = (template: any) => {
  modelData.value.printTemplateSetting.template = template
}
</script>
