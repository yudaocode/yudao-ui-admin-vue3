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
    <div>
      <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
        <el-form-item label="触发器类型" prop="type">
          <el-select v-model="configForm.type">
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
          v-if="configForm.type === TriggerTypeEnum.HTTP_REQUEST && configForm.httpRequestSetting"
        >
          <el-form-item>
            <el-alert
              title="仅支持 POST 请求，以请求体方式接收参数"
              type="warning"
              show-icon
              :closable="false"
            />
          </el-form-item>
          <!-- 请求地址-->
          <el-form-item label="请求地址" prop="httpRequestSetting.url">
            <el-input v-model="configForm.httpRequestSetting.url" />
          </el-form-item>
          <!-- 请求头，请求体设置-->
          <HttpRequestParamSetting
            :header="configForm.httpRequestSetting.header"
            :body="configForm.httpRequestSetting.body"
            :bind="'httpRequestSetting'"
          />
          <!-- 返回值设置-->
          <el-form-item label="返回值">
            <el-alert
              title="通过请求返回值, 可以修改流程表单的值"
              type="warning"
              show-icon
              :closable="false"
            />
          </el-form-item>
          <el-form-item>
            <div
              class="flex pt-2"
              v-for="(item, index) in configForm.httpRequestSetting.response"
              :key="index"
            >
              <div class="mr-2">
                <el-form-item
                  :prop="`httpRequestSetting.response.${index}.key`"
                  :rules="{
                    required: true,
                    message: '表单字段不能为空',
                    trigger: 'blur'
                  }"
                >
                  <el-select class="w-160px!" v-model="item.key" placeholder="请选择表单字段">
                    <el-option
                      v-for="(field, fIdx) in formFields"
                      :key="fIdx"
                      :label="field.title"
                      :value="field.field"
                      :disabled="!field.required"
                    />
                  </el-select>
                </el-form-item>
              </div>
              <div class="mr-2">
                <el-form-item
                  :prop="`httpRequestSetting.response.${index}.value`"
                  :rules="{
                    required: true,
                    message: '请求返回字段不能为空',
                    trigger: 'blur'
                  }"
                >
                  <el-input class="w-160px" v-model="item.value" placeholder="请求返回字段" />
                </el-form-item>
              </div>
              <div class="mr-1 pt-1 cursor-pointer">
                <Icon
                  icon="ep:delete"
                  :size="18"
                  @click="deleteHttpResponseSetting(configForm.httpRequestSetting.response!, index)"
                />
              </div>
            </div>
            <el-button
              type="primary"
              text
              @click="addHttpResponseSetting(configForm.httpRequestSetting.response!)"
            >
              <Icon icon="ep:plus" class="mr-5px" />添加一行
            </el-button>
          </el-form-item>
        </div>
        <div
          v-if="
            configForm.type === TriggerTypeEnum.UPDATE_NORMAL_FORM && configForm.normalFormSetting
          "
        >
          <el-divider content-position="left">修改表单设置</el-divider>
          <div
            class="flex items-center"
            v-for="key in Object.keys(configForm.normalFormSetting.updateFormFields!)"
            :key="key"
          >
            <div class="mr-2 flex items-center">
              <el-form-item>
                <el-select
                  class="w-160px!"
                  :model-value="key"
                  @update:model-value="(newKey) => updateFormFieldKey(key, newKey)"
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
                :prop="`normalFormSetting.updateFormFields.${key}`"
                :rules="{
                  required: true,
                  message: '值不能为空',
                  trigger: 'blur'
                }"
              >
                <el-input
                  class="w-160px"
                  v-model="configForm.normalFormSetting.updateFormFields![key]"
                  placeholder="请输入"
                  :disabled="!key"
                />
              </el-form-item>
            </div>
            <div class="mr-1 pt-1 cursor-pointer">
              <el-form-item>
                <Icon icon="ep:delete" :size="18" @click="deleteFormFieldSetting(key)" />
              </el-form-item>
            </div>
          </div>
          <el-button type="primary" text @click="addFormFieldSetting()">
            <Icon icon="ep:plus" class="mr-5px" />添加修改字段
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
import { SimpleFlowNode, NodeType, TriggerSetting, TRIGGER_TYPES, TriggerTypeEnum } from '../consts'
import { useWatchNode, useDrawer, useNodeName, useFormFields } from '../node'
import HttpRequestParamSetting from './components/HttpRequestParamSetting.vue'

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
  normalFormSetting: { updateFormFields: {} }
})
// 流程表单字段
const formFields = useFormFields()

// 可选的修改的表单字段
const optionalUpdateFormFields = computed(() => {
  const usedFields = Object.keys(configForm.value.normalFormSetting?.updateFormFields || {})
  return formFields.map((field) => ({
    title: field.title,
    field: field.field,
    disabled: usedFields.includes(field.field)
  }))
})

const updateFormFieldKey = (oldKey: string, newKey: string) => {
  if (!configForm.value.normalFormSetting?.updateFormFields) return
  const value = configForm.value.normalFormSetting.updateFormFields[oldKey]
  delete configForm.value.normalFormSetting.updateFormFields[oldKey]
  configForm.value.normalFormSetting.updateFormFields[newKey] = value
}

/** 添加 HTTP 请求返回值设置项*/
const addHttpResponseSetting = (responseSetting: Record<string, string>[]) => {
  responseSetting.push({
    key: '',
    value: ''
  })
}

/** 删除 HTTP 请求返回值设置项 */
const deleteHttpResponseSetting = (responseSetting: Record<string, string>[], index: number) => {
  responseSetting.splice(index, 1)
}

/** 添加修改表单设置项 */
const addFormFieldSetting = () => {
  if (configForm.value.normalFormSetting!.updateFormFields === undefined) {
    configForm.value.normalFormSetting!.updateFormFields = {}
  }
  configForm.value.normalFormSetting!.updateFormFields[''] = undefined
}
/** 删除修改表单设置项 */
const deleteFormFieldSetting = (key: string) => {
  if (!configForm.value.normalFormSetting?.updateFormFields) return
  delete configForm.value.normalFormSetting.updateFormFields[key]
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
    configForm.value.normalFormSetting = undefined
  }
  if (configForm.value.type === TriggerTypeEnum.UPDATE_NORMAL_FORM) {
    configForm.value.httpRequestSetting = undefined
  }
  currentNode.value.triggerSetting = configForm.value
  settingVisible.value = false
  return true
}

/** 获取节点展示内容 */
const getShowText = (): string => {
  let showText = ''
  if (configForm.value.type === TriggerTypeEnum.HTTP_REQUEST) {
    showText = `${configForm.value.httpRequestSetting?.url}`
  } else if (configForm.value.type === TriggerTypeEnum.UPDATE_NORMAL_FORM) {
    const updatefields = Object.keys(configForm.value.normalFormSetting?.updateFormFields || {})
    if (updatefields.length === 0) {
      message.warning('请设置修改表单字段')
    } else {
      showText = '修改表单数据'
    }
  }
  return showText
}

/** 显示触发器节点配置， 由父组件传过来 */
const showTriggerNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  if (node.triggerSetting) {
    configForm.value = {
      type: node.triggerSetting.type,
      httpRequestSetting: node.triggerSetting.httpRequestSetting || {
        url: '',
        header: [],
        body: [],
        response: []
      },
      normalFormSetting: node.triggerSetting.normalFormSetting || { updateFormFields: {} }
    }
  }
}

defineExpose({ openDrawer, showTriggerNodeConfig }) // 暴露方法给父组件
</script>

<style lang="scss" scoped></style>
