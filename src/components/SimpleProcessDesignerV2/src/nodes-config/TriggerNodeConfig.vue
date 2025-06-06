<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="630"
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
    <div>
      <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
        <el-form-item label="触发器类型" prop="type">
          <el-select v-model="configForm.type" @change="changeTriggerType">
            <el-option
              v-for="(item, index) in TRIGGER_TYPES"
              :key="index"
              :value="item.value"
              :label="item.label"
            />
          </el-select>
        </el-form-item>
        <!-- HTTP 请求触发器 -->
        <div
          v-if="
            [TriggerTypeEnum.HTTP_REQUEST, TriggerTypeEnum.HTTP_CALLBACK].includes(
              configForm.type
            ) && configForm.httpRequestSetting
          "
        >
          <HttpRequestSetting
            v-model:setting="configForm.httpRequestSetting"
            :responseEnable="configForm.type === TriggerTypeEnum.HTTP_REQUEST"
            :formItemPrefix="'httpRequestSetting'"
          />
        </div>

        <!-- 表单数据修改触发器 -->
        <div v-if="configForm.type === TriggerTypeEnum.FORM_UPDATE">
          <div v-for="(formSetting, index) in configForm.formSettings" :key="index">
            <el-card class="w-580px mt-4">
              <template #header>
                <div class="flex items-center justify-between">
                  <div>修改表单设置 {{ index + 1 }}</div>
                  <el-button
                    type="primary"
                    plain
                    circle
                    v-if="configForm.formSettings!.length > 1"
                    @click="deleteFormSetting(index)"
                  >
                    <Icon icon="ep:close" />
                  </el-button>
                </div>
              </template>

              <!-- 条件设置 -->
              <ConditionDialog
                :ref="`condition-${index}`"
                @update-condition="(val) => handleConditionUpdate(index, val)"
              />
              <div class="cursor-pointer" v-if="formSetting.conditionType">
                <el-tag
                  type="success"
                  effect="light"
                  closable
                  @close="deleteFormSettingCondition(formSetting)"
                  @click="openFormSettingCondition(index, formSetting)"
                >
                  {{ showConditionText(formSetting) }}
                </el-tag>
              </div>
              <el-button
                v-else
                type="primary"
                text
                @click="addFormSettingCondition(index, formSetting)"
              >
                <Icon icon="ep:link" class="mr-5px" />添加条件
              </el-button>
              <el-divider content-position="left">修改表单字段设置</el-divider>
              <!-- 表单字段修改设置 -->
              <div
                class="flex items-center"
                v-for="key in Object.keys(formSetting.updateFormFields || {})"
                :key="key"
              >
                <div class="mr-2 flex items-center">
                  <el-form-item>
                    <el-select
                      class="w-160px!"
                      :model-value="key"
                      @update:model-value="(newKey) => updateFormFieldKey(formSetting, key, newKey)"
                      placeholder="请选择表单字段"
                      :disabled="key !== ''"
                    >
                      <el-option
                        v-for="(field, fIdx) in optionalUpdateFormFields"
                        :key="fIdx"
                        :label="field.title"
                        :value="field.field"
                        :disabled="field.disabled"
                      />
                    </el-select>
                  </el-form-item>
                </div>
                <div class="mx-2"><el-form-item>的值设置为</el-form-item></div>
                <div class="mr-2">
                  <el-form-item
                    :prop="`formSettings.${index}.updateFormFields.${key}`"
                    :rules="{
                      required: true,
                      message: '值不能为空',
                      trigger: 'blur'
                    }"
                  >
                    <el-input
                      class="w-160px"
                      v-model="formSetting.updateFormFields![key]"
                      placeholder="请输入"
                      :disabled="!key"
                    />
                  </el-form-item>
                </div>
                <div class="mr-1 pt-1 cursor-pointer">
                  <el-form-item>
                    <Icon
                      icon="ep:delete"
                      :size="18"
                      @click="deleteFormFieldSetting(formSetting, key)"
                    />
                  </el-form-item>
                </div>
              </div>

              <!-- 添加表单字段按钮 -->
              <el-button type="primary" text @click="addFormFieldSetting(formSetting)">
                <Icon icon="ep:memo" class="mr-5px" />添加修改字段
              </el-button>
            </el-card>
          </div>

          <!-- 添加新的设置 -->
          <el-button class="mt-6" type="primary" text @click="addFormSetting">
            <Icon icon="ep:setting" class="mr-5px" />添加设置
          </el-button>
        </div>

        <!-- 表单数据删除触发器 -->
        <div v-if="configForm.type === TriggerTypeEnum.FORM_DELETE">
          <div v-for="(formSetting, index) in configForm.formSettings" :key="index">
            <el-card class="w-580px mt-4">
              <template #header>
                <div class="flex items-center justify-between">
                  <div>删除表单设置 {{ index + 1 }}</div>
                  <el-button
                    type="primary"
                    plain
                    circle
                    v-if="configForm.formSettings!.length > 1"
                    @click="deleteFormSetting(index)"
                  >
                    <Icon icon="ep:close" />
                  </el-button>
                </div>
              </template>

              <!-- 条件设置 -->
              <ConditionDialog
                :ref="`condition-${index}`"
                @update-condition="(val) => handleConditionUpdate(index, val)"
              />
              <div class="cursor-pointer" v-if="formSetting.conditionType">
                <el-tag
                  type="warning"
                  effect="light"
                  closable
                  @close="deleteFormSettingCondition(formSetting)"
                  @click="openFormSettingCondition(index, formSetting)"
                >
                  {{ showConditionText(formSetting) }}
                </el-tag>
              </div>
              <el-button
                v-else
                type="primary"
                text
                @click="addFormSettingCondition(index, formSetting)"
              >
                <Icon icon="ep:link" class="mr-5px" />添加条件
              </el-button>

              <el-divider content-position="left">删除表单字段设置</el-divider>
              <!-- 表单字段删除设置 -->
              <div class="flex flex-wrap gap-2">
                <el-select
                  v-model="formSetting.deleteFields"
                  multiple
                  placeholder="请选择要删除的字段"
                  class="w-full"
                >
                  <el-option
                    v-for="field in formFields"
                    :key="field.field"
                    :label="field.title"
                    :value="field.field"
                  />
                </el-select>
              </div>
            </el-card>
          </div>

          <!-- 添加新的设置 -->
          <el-button class="mt-6" type="primary" text @click="addFormSetting">
            <Icon icon="ep:setting" class="mr-5px" />添加设置
          </el-button>
        </div>
      </el-form>
    </div>
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
import {
  SimpleFlowNode,
  NodeType,
  TriggerSetting,
  TRIGGER_TYPES,
  TriggerTypeEnum,
  FormTriggerSetting,
  DEFAULT_CONDITION_GROUP_VALUE
} from '../consts'
import { useWatchNode, useDrawer, useNodeName, useFormFields, getConditionShowText } from '../node'
import HttpRequestSetting from './components/HttpRequestSetting.vue'
import ConditionDialog from './components/ConditionDialog.vue'
import { cloneDeep } from 'lodash-es'
const { proxy } = getCurrentInstance() as any

defineOptions({
  name: 'TriggerNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const message = useMessage() // 消息弹窗
// 抽屉配置
const { settingVisible, closeDrawer, openDrawer } = useDrawer()
// 当前节点
const currentNode = useWatchNode(props)
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.TRIGGER_NODE)
// 触发器表单配置
const formRef = ref() // 表单 Ref
// 表单校验规则
const formRules = reactive({
  type: [{ required: true, message: '触发器类型不能为空', trigger: 'change' }],
  'httpRequestSetting.url': [{ required: true, message: '请求地址不能为空', trigger: 'blur' }]
})
// 触发器配置表单数据
const configForm = ref<TriggerSetting>({
  type: TriggerTypeEnum.HTTP_REQUEST,
  httpRequestSetting: {
    url: '',
    header: [],
    body: [],
    response: []
  },
  formSettings: [
    {
      conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE),
      updateFormFields: {},
      deleteFields: []
    }
  ]
})
// 流程表单字段
const formFields = useFormFields()

// 可选的修改的表单字段
const optionalUpdateFormFields = computed(() => {
  return formFields.map((field) => ({
    title: field.title,
    field: field.field,
    disabled: false
  }))
})

let originalSetting: TriggerSetting | undefined

/** 触发器类型改变了 */
const changeTriggerType = () => {
  if (configForm.value.type === TriggerTypeEnum.HTTP_REQUEST) {
    configForm.value.httpRequestSetting =
      originalSetting?.type === TriggerTypeEnum.HTTP_REQUEST && originalSetting.httpRequestSetting
        ? originalSetting.httpRequestSetting
        : {
            url: '',
            header: [],
            body: [],
            response: []
          }
    configForm.value.formSettings = undefined
    return
  }

  if (configForm.value.type === TriggerTypeEnum.HTTP_CALLBACK) {
    configForm.value.httpRequestSetting =
      originalSetting?.type === TriggerTypeEnum.HTTP_CALLBACK && originalSetting.httpRequestSetting
        ? originalSetting.httpRequestSetting
        : {
            url: '',
            header: [],
            body: [],
            response: []
          }
    configForm.value.formSettings = undefined
    return
  }

  if (configForm.value.type === TriggerTypeEnum.FORM_UPDATE) {
    configForm.value.formSettings =
      originalSetting?.type === TriggerTypeEnum.FORM_UPDATE && originalSetting.formSettings
        ? originalSetting.formSettings
        : [
            {
              conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE),
              updateFormFields: {},
              deleteFields: []
            }
          ]
    configForm.value.httpRequestSetting = undefined
    return
  }

  if (configForm.value.type === TriggerTypeEnum.FORM_DELETE) {
    configForm.value.formSettings =
      originalSetting?.type === TriggerTypeEnum.FORM_DELETE && originalSetting.formSettings
        ? originalSetting.formSettings
        : [
            {
              conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE),
              updateFormFields: undefined,
              deleteFields: []
            }
          ]
    configForm.value.httpRequestSetting = undefined
    return
  }
}

/** 添加新的修改表单设置 */
const addFormSetting = () => {
  configForm.value.formSettings!.push({
    conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE),
    updateFormFields: {},
    deleteFields: []
  })
}

/** 删除修改表单设置 */
const deleteFormSetting = (index: number) => {
  configForm.value.formSettings!.splice(index, 1)
}

/** 添加条件配置 */
const addFormSettingCondition = (index: number, formSetting: FormTriggerSetting) => {
  const conditionDialog = proxy.$refs[`condition-${index}`][0]
  conditionDialog.open(formSetting)
}
/** 删除条件配置 */
const deleteFormSettingCondition = (formSetting: FormTriggerSetting) => {
  formSetting.conditionType = undefined
}
/** 打开条件配置弹窗 */
const openFormSettingCondition = (index: number, formSetting: FormTriggerSetting) => {
  const conditionDialog = proxy.$refs[`condition-${index}`][0]
  conditionDialog.open(formSetting)
}
/** 处理条件配置保存 */
const handleConditionUpdate = (index: number, condition: any) => {
  configForm.value.formSettings![index].conditionType = condition.conditionType
  configForm.value.formSettings![index].conditionExpression = condition.conditionExpression
  configForm.value.formSettings![index].conditionGroups = condition.conditionGroups
}
/** 条件配置展示 */
const showConditionText = (formSetting: FormTriggerSetting) => {
  return getConditionShowText(
    formSetting.conditionType,
    formSetting.conditionExpression,
    formSetting.conditionGroups,
    formFields
  )
}

/** 添加修改字段设置项 */
const addFormFieldSetting = (formSetting: FormTriggerSetting) => {
  if (!formSetting) return
  if (!formSetting.updateFormFields) {
    formSetting.updateFormFields = {}
  }
  formSetting.updateFormFields[''] = undefined
}
/** 更新字段 KEY */
const updateFormFieldKey = (formSetting: FormTriggerSetting, oldKey: string, newKey: string) => {
  if (!formSetting?.updateFormFields) return
  const value = formSetting.updateFormFields[oldKey]
  delete formSetting.updateFormFields[oldKey]
  formSetting.updateFormFields[newKey] = value
}

/** 删除修改字段设置项 */
const deleteFormFieldSetting = (formSetting: FormTriggerSetting, key: string) => {
  if (!formSetting?.updateFormFields) return
  delete formSetting.updateFormFields[key]
}

/** 保存配置 */
const saveConfig = async () => {
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.name = nodeName.value!
  currentNode.value.showText = showText
  if (configForm.value.type === TriggerTypeEnum.HTTP_REQUEST) {
    configForm.value.formSettings = undefined
  } else if (configForm.value.type === TriggerTypeEnum.FORM_UPDATE) {
    configForm.value.httpRequestSetting = undefined
    // 清理删除字段相关的数据
    configForm.value.formSettings?.forEach((setting) => {
      setting.deleteFields = undefined
    })
  } else if (configForm.value.type === TriggerTypeEnum.FORM_DELETE) {
    configForm.value.httpRequestSetting = undefined
    // 清理修改字段相关的数据
    configForm.value.formSettings?.forEach((setting) => {
      setting.updateFormFields = undefined
    })
  }
  currentNode.value.triggerSetting = configForm.value
  settingVisible.value = false
  return true
}

/** 获取节点展示内容 */
const getShowText = (): string => {
  let showText = ''
  if (
    configForm.value.type === TriggerTypeEnum.HTTP_REQUEST ||
    configForm.value.type === TriggerTypeEnum.HTTP_CALLBACK
  ) {
    showText = `${configForm.value.httpRequestSetting?.url}`
  } else if (configForm.value.type === TriggerTypeEnum.FORM_UPDATE) {
    for (const [index, setting] of configForm.value.formSettings!.entries()) {
      if (!setting.updateFormFields || Object.keys(setting.updateFormFields).length === 0) {
        message.warning(`请添加表单设置${index + 1}的修改字段`)
        return ''
      }
    }
    showText = '修改表单数据'
  } else if (configForm.value.type === TriggerTypeEnum.FORM_DELETE) {
    for (const [index, setting] of configForm.value.formSettings!.entries()) {
      if (!setting.deleteFields || setting.deleteFields.length === 0) {
        message.warning(`请选择表单设置${index + 1}要删除的字段`)
        return ''
      }
    }
    showText = '删除表单数据'
  }
  return showText
}

/** 显示触发器节点配置， 由父组件传过来 */
const showTriggerNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  originalSetting = node.triggerSetting ? JSON.parse(JSON.stringify(node.triggerSetting)) : {}
  if (node.triggerSetting) {
    configForm.value = {
      type: node.triggerSetting.type,
      httpRequestSetting: node.triggerSetting.httpRequestSetting || {
        url: '',
        header: [],
        body: [],
        response: []
      },
      formSettings: node.triggerSetting.formSettings || [
        {
          conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE),
          updateFormFields: {},
          deleteFields: []
        }
      ]
    }
  }
}

defineExpose({ openDrawer, showTriggerNodeConfig }) // 暴露方法给父组件
</script>

<style lang="scss" scoped></style>
