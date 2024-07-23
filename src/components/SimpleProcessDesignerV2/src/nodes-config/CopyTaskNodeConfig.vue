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
      <el-tab-pane label="抄送人" name="user">
        <div>
          <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
            <el-form-item label="抄送人设置" prop="candidateStrategy">
              <el-radio-group
                v-model="configForm.candidateStrategy"
                @change="changeCandidateStrategy"
              >
                <el-radio
                  v-for="(dict, index) in copyUserStrategies"
                  :key="index"
                  :value="dict.value"
                  :label="dict.value"
                >
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="configForm.candidateStrategy == CandidateStrategy.ROLE"
              label="指定角色"
              prop="candidateParamArray"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="
                configForm.candidateStrategy == CandidateStrategy.DEPT_MEMBER ||
                configForm.candidateStrategy == CandidateStrategy.DEPT_LEADER
              "
              label="指定部门"
              prop="candidateParamArray"
              span="24"
            >
              <el-tree-select
                ref="treeRef"
                v-model="configForm.candidateParamArray"
                :data="deptTreeOptions"
                :props="defaultProps"
                empty-text="加载中，请稍后"
                multiple
                node-key="id"
                style="width: 100%"
                show-checkbox
              />
            </el-form-item>
            <el-form-item
              v-if="configForm.candidateStrategy == CandidateStrategy.POST"
              label="指定岗位"
              prop="candidateParamArray"
              span="24"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in postOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id!"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="configForm.candidateStrategy == CandidateStrategy.USER"
              label="指定用户"
              prop="candidateParamArray"
              span="24"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in userOptions"
                  :key="item.id"
                  :label="item.nickname"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="configForm.candidateStrategy === CandidateStrategy.USER_GROUP"
              label="指定用户组"
              prop="candidateParamArray"
            >
              <el-select
                v-model="configForm.candidateParamArray"
                clearable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in userGroupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="configForm.candidateStrategy === CandidateStrategy.EXPRESSION"
              label="流程表达式"
              prop="candidateParamArray"
            >
              <el-input
                type="textarea"
                v-model="configForm.candidateParamArray[0]"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane label="表单字段权限" name="fields" v-if="formType === 10">
        <div class="field-setting-pane">
          <div class="field-setting-desc">字段权限</div>
          <div class="field-permit-title">
            <div class="setting-title-label first-title"> 字段名称 </div>
            <div class="other-titles">
              <span class="setting-title-label">只读</span>
              <span class="setting-title-label">可编辑</span>
              <span class="setting-title-label">隐藏</span>
            </div>
          </div>
          <div
            class="field-setting-item"
            v-for="(item, index) in fieldsPermissionConfig"
            :key="index"
          >
            <div class="field-setting-item-label"> {{ item.title }} </div>
            <el-radio-group class="field-setting-item-group" v-model="item.permission">
              <div class="item-radio-wrap">
                <el-radio value="1" size="large" label="1"><span></span></el-radio>
              </div>
              <div class="item-radio-wrap">
                <el-radio value="2" size="large" label="2" disabled><span></span></el-radio>
              </div>
              <div class="item-radio-wrap">
                <el-radio value="3" size="large" label="3"><span></span></el-radio>
              </div>
            </el-radio-group>
          </div>
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
import { SimpleFlowNode, CandidateStrategy, NodeType } from '../consts'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import {
  useWatchNode,
  useDrawer,
  useNodeName,
  useFormFieldsPermission,
  useNodeForm,
  CopyTaskFormType
} from '../node'
import { defaultProps } from '@/utils/tree'
defineOptions({
  name: 'CopyTaskNodeConfig'
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
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.COPY_TASK_NODE)
// 激活的 Tab 标签页
const activeTabName = ref('user')
// 表单字段权限配置
const { formType, fieldsPermissionConfig, getNodeConfigFormFields } = useFormFieldsPermission()
// 抄送人表单配置
const formRef = ref() // 表单 Ref
// 表单校验规则
const formRules = reactive({
  candidateStrategy: [{ required: true, message: '抄送人设置不能为空', trigger: 'change' }],
  candidateParamArray: [{ required: true, message: '选项不能为空', trigger: 'blur' }]
})

const {
  configForm: tempConfigForm,
  roleOptions,
  postOptions,
  userOptions,
  userGroupOptions,
  deptTreeOptions,
  getShowText
} = useNodeForm(NodeType.COPY_TASK_NODE)
const configForm = tempConfigForm as Ref<CopyTaskFormType>
// 抄送人策略， 去掉发起人自选 和 发起人自己
const copyUserStrategies = computed(() => {
  return getIntDictOptions(DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY).filter(
    (item) =>
      item.value !== CandidateStrategy.START_USER_SELECT &&
      item.value !== CandidateStrategy.START_USER
  )
})
// 改变抄送人设置策略
const changeCandidateStrategy = () => {
  configForm.value.candidateParamArray = []
}
// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'user'
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.name = nodeName.value!
  currentNode.value.candidateParam = configForm.value.candidateParamArray?.join(',')
  currentNode.value.candidateStrategy = configForm.value.candidateStrategy
  currentNode.value.showText = showText
  currentNode.value.fieldsPermission = fieldsPermissionConfig.value
  settingVisible.value = false
  return true
}
// 显示抄送节点配置， 由父组件传过来
const showCopyTaskNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  // 抄送人设置
  configForm.value.candidateStrategy = node.candidateStrategy!
  const strCandidateParam = node?.candidateParam
  if (node.candidateStrategy === CandidateStrategy.EXPRESSION) {
    configForm.value.candidateParamArray[0] = strCandidateParam
  } else {
    if (strCandidateParam) {
      configForm.value.candidateParamArray = strCandidateParam.split(',').map((item) => +item)
    }
  }
  // 表单字段权限
  getNodeConfigFormFields(node.fieldsPermission)
}

defineExpose({ openDrawer, showCopyTaskNodeConfig }) // 暴露方法给父组件
</script>

<style lang="scss" scoped></style>
