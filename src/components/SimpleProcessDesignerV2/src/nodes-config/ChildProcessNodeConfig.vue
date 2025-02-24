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
              <el-switch
                v-model="configForm.async"
                active-text="异步"
                inactive-text="不异步"
              />
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
                    @click="deleteVariable(configForm.inVariables, index)"
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
                    @click="deleteVariable(configForm.outVariables, index)"
                  />
                </div>
              </div>
              <el-button type="primary" text @click="addVariable(configForm.outVariables)">
                <Icon icon="ep:plus" class="mr-5px" />添加一行
              </el-button>
            </el-form-item>
            <el-form-item label="子流程发起人" prop="startUserType">
              <el-radio-group v-model="configForm.startUserType">
                <el-radio :value="1">同主流程发起人</el-radio>
                <el-radio :value="2">表单</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="configForm.startUserType === 2"
              label="当子流程发起人为空时"
              prop="startUserType"
            >
              <el-radio-group v-model="configForm.startUserEmptyType">
                <el-radio :value="1">同主流程发起人</el-radio>
                <el-radio :value="2">子流程管理员</el-radio>
                <el-radio :value="3">主流程管理员</el-radio>
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
import { SimpleFlowNode, NodeType } from '../consts'
import { useWatchNode, useDrawer, useNodeName, useFormFieldsAndStartUser } from '../node'
import { parseFormFields } from '@/components/FormCreate/src/utils'
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
  startUserFormField: [{ required: true, message: '发起人表单不能为空', trigger: 'change' }]
})
const configForm = ref({
  calledProcessDefinitionKey: '',
  skipStartUserNode: false,
  inVariables: [],
  outVariables: [],
  startUserType: 1,
  startUserEmptyType: 1,
  startUserFormField: ''
})
const childProcessOptions = ref()
const formFieldOptions = useFormFieldsAndStartUser()
const childFormFieldOptions = ref()

// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'child'
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const childInfo = childProcessOptions.value.find(
    (option) => option.key === configForm.value.calledProcessDefinitionKey
  )
  currentNode.value.name = nodeName.value!
  if (currentNode.value.childProcessSetting) {
    currentNode.value.childProcessSetting.async = configForm.value.async
    currentNode.value.childProcessSetting.calledProcessDefinitionKey = childInfo.key
    currentNode.value.childProcessSetting.calledProcessDefinitionName = childInfo.name
    currentNode.value.childProcessSetting.skipStartUserNode = configForm.value.skipStartUserNode
    currentNode.value.childProcessSetting.inVariables = configForm.value.inVariables
    currentNode.value.childProcessSetting.outVariables = configForm.value.outVariables
    currentNode.value.childProcessSetting.startUserSetting.type = configForm.value.startUserType
    currentNode.value.childProcessSetting.startUserSetting.emptyType =
      configForm.value.startUserEmptyType
    currentNode.value.childProcessSetting.startUserSetting.formField =
      configForm.value.startUserFormField
  }
  currentNode.value.showText = `调用子流程：${childInfo.name}`
  settingVisible.value = false
  return true
}
// 显示子流程节点配置， 由父组件传过来
const showChildProcessNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  if (node.childProcessSetting) {
    configForm.value.async =
      node.childProcessSetting.async
    configForm.value.calledProcessDefinitionKey =
      node.childProcessSetting.calledProcessDefinitionKey
    configForm.value.skipStartUserNode = node.childProcessSetting.skipStartUserNode
    configForm.value.inVariables = node.childProcessSetting.inVariables
    configForm.value.outVariables = node.childProcessSetting.outVariables
    configForm.value.startUserType = node.childProcessSetting.startUserSetting.type
    configForm.value.startUserEmptyType = node.childProcessSetting.startUserSetting.emptyType ?? 1
    configForm.value.startUserFormField = node.childProcessSetting.startUserSetting.formField ?? ''
  }
  loadFormInfo()
}

defineExpose({ openDrawer, showChildProcessNodeConfig }) // 暴露方法给父组件

const addVariable = (arr) => {
  arr.push({
    source: '',
    target: ''
  })
}
const deleteVariable = (arr, index: number) => {
  arr.splice(index, 1)
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
  console.log(childFormFieldOptions.value)
}

onMounted(async () => {
  childProcessOptions.value = await getModelList(undefined)
})
</script>

<style lang="scss" scoped></style>
