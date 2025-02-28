<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
  >
    <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="nodeName"
          :placeholder="nodeName"
        />
        <div v-else class="node-name">
          {{ nodeName }} <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()" />
        </div>
        <div class="divide-line"></div>
      </div>
    </template>
    <el-tabs type="border-card" v-model="activeTabName">
      <el-tab-pane label="子流程" name="child">
        <div>
          <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
            <el-form-item label="是否异步" prop="async">
              <el-switch v-model="configForm.async" active-text="异步" inactive-text="不异步" />
            </el-form-item>
            <el-form-item label="选择子流程" prop="calledProcessDefinitionKey">
              <el-select
                v-model="configForm.calledProcessDefinitionKey"
                clearable
                @change="handleCalledElementChange"
              >
                <el-option
                  v-for="(item, index) in childProcessOptions"
                  :key="index"
                  :label="item.name"
                  :value="item.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="是否自动跳过子流程发起节点" prop="skipStartUserNode">
              <el-switch
                v-model="configForm.skipStartUserNode"
                active-text="跳过"
                inactive-text="不跳过"
              />
            </el-form-item>
            <el-form-item label="主→子变量传递" prop="inVariables">
              <div class="flex pt-2" v-for="(item, index) in configForm.inVariables" :key="index">
                <div class="mr-2">
                  <el-form-item
                    :prop="`inVariables.${index}.source`"
                    :rules="{
                      required: true,
                      message: '变量不能为空',
                      trigger: 'blur'
                    }"
                  >
                    <el-select class="w-200px!" v-model="item.source">
                      <el-option
                        v-for="(field, fIdx) in formFieldOptions"
                        :key="fIdx"
                        :label="field.title"
                        :value="field.field"
                      />
                    </el-select>
                  </el-form-item>
                </div>
                <div class="mr-2">
                  <el-form-item
                    :prop="`inVariables.${index}.target`"
                    :rules="{
                      required: true,
                      message: '变量不能为空',
                      trigger: 'blur'
                    }"
                  >
                    <el-select class="w-200px!" v-model="item.target">
                      <el-option
                        v-for="(field, fIdx) in childFormFieldOptions"
                        :key="fIdx"
                        :label="field.title"
                        :value="field.field"
                      />
                    </el-select>
                  </el-form-item>
                </div>
                <div class="mr-1 flex items-center">
                  <Icon
                    icon="ep:delete"
                    :size="18"
                    @click="deleteVariable(index, configForm.inVariables)"
                  />
                </div>
              </div>
              <el-button type="primary" text @click="addVariable(configForm.inVariables)">
                <Icon icon="ep:plus" class="mr-5px" />添加一行
              </el-button>
            </el-form-item>
            <el-form-item
              v-if="configForm.async === false"
              label="子→主变量传递"
              prop="outVariables"
            >
              <div class="flex pt-2" v-for="(item, index) in configForm.outVariables" :key="index">
                <div class="mr-2">
                  <el-form-item
                    :prop="`outVariables.${index}.source`"
                    :rules="{
                      required: true,
                      message: '变量不能为空',
                      trigger: 'blur'
                    }"
                  >
                    <el-select class="w-200px!" v-model="item.source">
                      <el-option
                        v-for="(field, fIdx) in childFormFieldOptions"
                        :key="fIdx"
                        :label="field.title"
                        :value="field.field"
                      />
                    </el-select>
                  </el-form-item>
                </div>
                <div class="mr-2">
                  <el-form-item
                    :prop="`outVariables.${index}.target`"
                    :rules="{
                      required: true,
                      message: '变量不能为空',
                      trigger: 'blur'
                    }"
                  >
                    <el-select class="w-200px!" v-model="item.target">
                      <el-option
                        v-for="(field, fIdx) in formFieldOptions"
                        :key="fIdx"
                        :label="field.title"
                        :value="field.field"
                      />
                    </el-select>
                  </el-form-item>
                </div>
                <div class="mr-1 flex items-center">
                  <Icon
                    icon="ep:delete"
                    :size="18"
                    @click="deleteVariable(index, configForm.outVariables)"
                  />
                </div>
              </div>
              <el-button type="primary" text @click="addVariable(configForm.outVariables)">
                <Icon icon="ep:plus" class="mr-5px" />添加一行
              </el-button>
            </el-form-item>
            <el-form-item label="子流程发起人" prop="startUserType">
              <el-radio-group v-model="configForm.startUserType">
                <el-radio
                  v-for="item in CHILD_PROCESS_START_USER_TYPE"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="configForm.startUserType === ChildProcessStartUserTypeEnum.FROM_FORM"
              label="当子流程发起人为空时"
              prop="startUserType"
            >
              <el-radio-group v-model="configForm.startUserEmptyType">
                <el-radio
                  v-for="item in CHILD_PROCESS_START_USER_EMPTY_TYPE"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="configForm.startUserType === 2"
              label="发起人表单"
              prop="startUserFormField"
            >
              <el-select class="w-200px!" v-model="configForm.startUserFormField">
                <el-option
                  v-for="(field, fIdx) in formFieldOptions"
                  :key="fIdx"
                  :label="field.title"
                  :value="field.field"
                />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">超时设置</el-divider>
            <el-form-item label="启用开关" prop="timeoutEnable">
              <el-switch
                v-model="configForm.timeoutEnable"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <div v-if="configForm.timeoutEnable">
              <el-form-item prop="timeoutType">
                <el-radio-group v-model="configForm.timeoutType">
                  <el-radio-button
                    v-for="item in DELAY_TYPE"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="configForm.timeoutType === DelayTypeEnum.FIXED_TIME_DURATION">
                <el-form-item prop="timeDuration">
                  <el-input-number
                    class="mr-2"
                    :style="{ width: '100px' }"
                    v-model="configForm.timeDuration"
                    :min="1"
                    controls-position="right"
                  />
                </el-form-item>
                <el-select v-model="configForm.timeUnit" class="mr-2" :style="{ width: '100px' }">
                  <el-option
                    v-for="item in TIME_UNIT_TYPES"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-text>后进入下一节点</el-text>
              </el-form-item>
              <el-form-item
                v-if="configForm.timeoutType === DelayTypeEnum.FIXED_DATE_TIME"
                prop="dateTime"
              >
                <el-date-picker
                  class="mr-2"
                  v-model="configForm.dateTime"
                  type="datetime"
                  placeholder="请选择日期和时间"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                />
                <el-text>后进入下一节点</el-text>
              </el-form-item>
            </div>

            <el-divider content-position="left">多实例设置</el-divider>
            <el-form-item label="启用开关" prop="multiInstanceEnable">
              <el-switch
                v-model="configForm.multiInstanceEnable"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <div v-if="configForm.multiInstanceEnable">
              <el-form-item prop="sequential">
                <el-switch
                  v-model="configForm.sequential"
                  active-text="串行"
                  inactive-text="并行"
                />
              </el-form-item>
              <el-form-item prop="approveRatio">
                <el-text>完成比例(%)</el-text>
                <el-input-number
                  class="ml-10px"
                  v-model="configForm.approveRatio"
                  :min="10"
                  :max="100"
                  :step="10"
                />
              </el-form-item>
              <el-form-item prop="multiInstanceSourceType">
                <el-text>多实例来源</el-text>
                <el-select
                  class="ml-10px w-200px!"
                  v-model="configForm.multiInstanceSourceType"
                  @change="handleMultiInstanceSourceTypeChange"
                >
                  <el-option
                    v-for="item in CHILD_PROCESS_MULTI_INSTANCE_SOURCE_TYPE"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item v-if="configForm.multiInstanceSourceType === ChildProcessMultiInstanceSourceTypeEnum.FIXED_QUANTITY">
                <el-input-number v-model="configForm.multiInstanceSource" :min="1" />
              </el-form-item>
              <el-form-item v-if="configForm.multiInstanceSourceType === ChildProcessMultiInstanceSourceTypeEnum.NUMBER_FORM">
                <el-select class="w-200px!" v-model="configForm.multiInstanceSource">
                  <el-option
                    v-for="(field, fIdx) in digitalFormFieldOptions"
                    :key="fIdx"
                    :label="field.title"
                    :value="field.field"
                  />
                </el-select>
              </el-form-item>
              <el-form-item v-if="configForm.multiInstanceSourceType === ChildProcessMultiInstanceSourceTypeEnum.MULTIPLE_FORM">
                <el-select class="w-200px!" v-model="configForm.multiInstanceSource">
                  <el-option
                    v-for="(field, fIdx) in multiFormFieldOptions"
                    :key="fIdx"
                    :label="field.title"
                    :value="field.field"
                  />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-divider />
      <div>
        <el-button type="primary" @click="saveConfig">确 定</el-button>
        <el-button @click="closeDrawer">取 消</el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script setup lang="ts">
import { getModelList } from '@/api/bpm/model'
import { getForm } from '@/api/bpm/form'
import {
  SimpleFlowNode,
  NodeType,
  TIME_UNIT_TYPES,
  TimeUnitType,
  DelayTypeEnum,
  DELAY_TYPE,
  IOParameter,
  ChildProcessStartUserTypeEnum,
  CHILD_PROCESS_START_USER_TYPE,
  ChildProcessStartUserEmptyTypeEnum,
  CHILD_PROCESS_START_USER_EMPTY_TYPE,
  CHILD_PROCESS_MULTI_INSTANCE_SOURCE_TYPE,
  ChildProcessMultiInstanceSourceTypeEnum
} from '../consts'
import { useWatchNode, useDrawer, useNodeName, useFormFieldsAndStartUser } from '../node'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import { convertTimeUnit } from '../utils'
defineOptions({
  name: 'ChildProcessNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 抽屉配置
const { settingVisible, closeDrawer, openDrawer } = useDrawer()
// 当前节点
const currentNode = useWatchNode(props)
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.CHILD_PROCESS_NODE)
// 激活的 Tab 标签页
const activeTabName = ref('child')
// 子流程表单配置
const formRef = ref() // 表单 Ref
// 表单校验规则
const formRules = reactive({
  async: [{ required: true, message: '是否异步不能为空', trigger: 'change' }],
  calledProcessDefinitionKey: [{ required: true, message: '子流程不能为空', trigger: 'change' }],
  skipStartUserNode: [
    { required: true, message: '是否自动跳过子流程发起节点不能为空', trigger: 'change' }
  ],
  startUserType: [{ required: true, message: '子流程发起人不能为空', trigger: 'change' }],
  startUserEmptyType: [
    { required: true, message: '当子流程发起人为空时不能为空', trigger: 'change' }
  ],
  startUserFormField: [{ required: true, message: '发起人表单不能为空', trigger: 'change' }],
  timeoutEnable: [{ required: true, message: '超时设置是否开启不能为空', trigger: 'change' }],
  timeoutType: [{ required: true, message: '超时设置时间不能为空', trigger: 'change' }],
  timeDuration: [{ required: true, message: '超时设置时间不能为空', trigger: 'change' }],
  dateTime: [{ required: true, message: '超时设置时间不能为空', trigger: 'change' }],
  multiInstanceEnable: [{ required: true, message: '多实例设置不能为空', trigger: 'change' }]
})
type ChildProcessFormType = {
  async: boolean
  calledProcessDefinitionKey: string
  skipStartUserNode: boolean
  inVariables?: IOParameter[]
  outVariables?: IOParameter[]
  startUserType: ChildProcessStartUserTypeEnum
  startUserEmptyType: ChildProcessStartUserEmptyTypeEnum
  startUserFormField: string
  timeoutEnable: boolean
  timeoutType: DelayTypeEnum
  timeDuration: number
  timeUnit: TimeUnitType
  dateTime: string
  multiInstanceEnable: boolean
  sequential: boolean
  approveRatio: number
  multiInstanceSourceType: ChildProcessMultiInstanceSourceTypeEnum
  multiInstanceSource: string
}
const configForm = ref<ChildProcessFormType>({
  async: false,
  calledProcessDefinitionKey: '',
  skipStartUserNode: false,
  inVariables: [],
  outVariables: [],
  startUserType: ChildProcessStartUserTypeEnum.MAIN_PROCESS_START_USER,
  startUserEmptyType: ChildProcessStartUserEmptyTypeEnum.MAIN_PROCESS_START_USER,
  startUserFormField: '',
  timeoutEnable: false,
  timeoutType: DelayTypeEnum.FIXED_TIME_DURATION,
  timeDuration: 1,
  timeUnit: TimeUnitType.HOUR,
  dateTime: '',
  multiInstanceEnable: false,
  sequential: false,
  approveRatio: 100,
  multiInstanceSourceType: ChildProcessMultiInstanceSourceTypeEnum.FIXED_QUANTITY,
  multiInstanceSource: ''
})
const childProcessOptions = ref()
const formFieldOptions = useFormFieldsAndStartUser()
const digitalFormFieldOptions = computed(() => {
  return formFieldOptions.filter((item) => item.type === 'inputNumber')
})
const multiFormFieldOptions = computed(() => {
  return formFieldOptions.filter((item) => item.type === 'select' || item.type === 'checkbox')
})
const childFormFieldOptions = ref()

// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'child'
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const childInfo = childProcessOptions.value.find(
    (option: any) => option.key === configForm.value.calledProcessDefinitionKey
  )
  currentNode.value.name = nodeName.value!
  if (currentNode.value.childProcessSetting) {
    // 1. 是否异步
    currentNode.value.childProcessSetting.async = configForm.value.async
    // 2. 调用流程
    currentNode.value.childProcessSetting.calledProcessDefinitionKey = childInfo.key
    currentNode.value.childProcessSetting.calledProcessDefinitionName = childInfo.name
    // 3. 是否跳过发起人
    currentNode.value.childProcessSetting.skipStartUserNode = configForm.value.skipStartUserNode
    // 4. 主->子变量
    currentNode.value.childProcessSetting.inVariables = configForm.value.inVariables
    // 5. 子->主变量
    currentNode.value.childProcessSetting.outVariables = configForm.value.outVariables
    // 6. 发起人设置
    currentNode.value.childProcessSetting.startUserSetting.type = configForm.value.startUserType
    currentNode.value.childProcessSetting.startUserSetting.emptyType =
      configForm.value.startUserEmptyType
    currentNode.value.childProcessSetting.startUserSetting.formField =
      configForm.value.startUserFormField
    // 7. 超时设置
    currentNode.value.childProcessSetting.timeoutSetting = {
      enable: configForm.value.timeoutEnable
    }
    if (configForm.value.timeoutEnable) {
      currentNode.value.childProcessSetting.timeoutSetting.type = configForm.value.timeoutType
      if (configForm.value.timeoutType === DelayTypeEnum.FIXED_TIME_DURATION) {
        currentNode.value.childProcessSetting.timeoutSetting.timeExpression = getIsoTimeDuration()
      }
      if (configForm.value.timeoutType === DelayTypeEnum.FIXED_DATE_TIME) {
        currentNode.value.childProcessSetting.timeoutSetting.timeExpression =
          configForm.value.dateTime
      }
    }
    // 8. 多实例设置
    currentNode.value.childProcessSetting.multiInstanceSetting = {
      enable: configForm.value.multiInstanceEnable
    }
    if (configForm.value.multiInstanceEnable) {
      currentNode.value.childProcessSetting.multiInstanceSetting.sequential =
        configForm.value.sequential
      currentNode.value.childProcessSetting.multiInstanceSetting.approveRatio =
        configForm.value.approveRatio
      currentNode.value.childProcessSetting.multiInstanceSetting.sourceType =
        configForm.value.multiInstanceSourceType
      currentNode.value.childProcessSetting.multiInstanceSetting.source =
        configForm.value.multiInstanceSource
    }
  }

  currentNode.value.showText = `调用子流程：${childInfo.name}`
  settingVisible.value = false
  return true
}
// 显示子流程节点配置， 由父组件传过来
const showChildProcessNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  if (node.childProcessSetting) {
    // 1. 是否异步
    configForm.value.async = node.childProcessSetting.async
    // 2. 调用流程
    configForm.value.calledProcessDefinitionKey =
      node.childProcessSetting?.calledProcessDefinitionKey
    // 3. 是否跳过发起人
    configForm.value.skipStartUserNode = node.childProcessSetting.skipStartUserNode
    // 4. 主->子变量
    configForm.value.inVariables = node.childProcessSetting.inVariables
    // 5. 子->主变量
    configForm.value.outVariables = node.childProcessSetting.outVariables
    // 6. 发起人设置
    configForm.value.startUserType = node.childProcessSetting.startUserSetting.type
    configForm.value.startUserEmptyType = node.childProcessSetting.startUserSetting.emptyType ?? ChildProcessStartUserEmptyTypeEnum.MAIN_PROCESS_START_USER
    configForm.value.startUserFormField = node.childProcessSetting.startUserSetting.formField ?? ''
    // 7. 超时设置
    configForm.value.timeoutEnable = node.childProcessSetting.timeoutSetting.enable ?? false
    if (configForm.value.timeoutEnable) {
      configForm.value.timeoutType =
        node.childProcessSetting.timeoutSetting.type ?? DelayTypeEnum.FIXED_TIME_DURATION
      // 固定时长
      if (configForm.value.timeoutType === DelayTypeEnum.FIXED_TIME_DURATION) {
        const strTimeDuration = node.childProcessSetting.timeoutSetting.timeExpression ?? ''
        let parseTime = strTimeDuration.slice(2, strTimeDuration.length - 1)
        let parseTimeUnit = strTimeDuration.slice(strTimeDuration.length - 1)
        configForm.value.timeDuration = parseInt(parseTime)
        configForm.value.timeUnit = convertTimeUnit(parseTimeUnit)
      }
      // 固定日期时间
      if (configForm.value.timeoutType === DelayTypeEnum.FIXED_DATE_TIME) {
        configForm.value.dateTime = node.childProcessSetting.timeoutSetting.timeExpression ?? ''
      }
    }
    // 8. 多实例设置
    configForm.value.multiInstanceEnable =
      node.childProcessSetting.multiInstanceSetting.enable ?? false
    if (configForm.value.multiInstanceEnable) {
      configForm.value.sequential =
        node.childProcessSetting.multiInstanceSetting.sequential ?? false
      configForm.value.approveRatio =
        node.childProcessSetting.multiInstanceSetting.approveRatio ?? 100
      configForm.value.multiInstanceSourceType =
        node.childProcessSetting.multiInstanceSetting.sourceType ??
        ChildProcessMultiInstanceSourceTypeEnum.FIXED_QUANTITY
      configForm.value.multiInstanceSource =
        node.childProcessSetting.multiInstanceSetting.source ?? ''
    }
  }
  loadFormInfo()
}

defineExpose({ openDrawer, showChildProcessNodeConfig }) // 暴露方法给父组件

const addVariable = (arr?: IOParameter[]) => {
  arr?.push({
    source: '',
    target: ''
  })
}
const deleteVariable = (index: number, arr?: IOParameter[]) => {
  arr?.splice(index, 1)
}
const handleCalledElementChange = () => {
  configForm.value.inVariables = []
  configForm.value.outVariables = []
  loadFormInfo()
}
const loadFormInfo = async () => {
  const childInfo = childProcessOptions.value.find(
    (option) => option.key === configForm.value.calledProcessDefinitionKey
  )
  const formInfo = await getForm(childInfo.formId)
  childFormFieldOptions.value = []
  if (formInfo.fields) {
    formInfo.fields.forEach((fieldStr: string) => {
      parseFormFields(JSON.parse(fieldStr), childFormFieldOptions.value)
    })
  }
}
const getIsoTimeDuration = () => {
  let strTimeDuration = 'PT'
  if (configForm.value.timeUnit === TimeUnitType.MINUTE) {
    strTimeDuration += configForm.value.timeDuration + 'M'
  }
  if (configForm.value.timeUnit === TimeUnitType.HOUR) {
    strTimeDuration += configForm.value.timeDuration + 'H'
  }
  if (configForm.value.timeUnit === TimeUnitType.DAY) {
    strTimeDuration += configForm.value.timeDuration + 'D'
  }
  return strTimeDuration
}
const handleMultiInstanceSourceTypeChange = () => {
  configForm.value.multiInstanceSource = ''
}

onMounted(async () => {
  childProcessOptions.value = await getModelList(undefined)
})
</script>

<style lang="scss" scoped></style>
