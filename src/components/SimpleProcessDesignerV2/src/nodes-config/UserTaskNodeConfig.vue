<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
    class="justify-start"
  >
    <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="currentNode.name"
          :placeholder="currentNode.name"
        />
        <div v-else class="node-name"
          >{{ currentNode.name }}
          <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()"
        /></div>

        <div class="divide-line"></div>
      </div>
    </template>
    <el-tabs type="border-card" v-model="activeTabName">
      <el-tab-pane label="审批人" name="user">
        <div>
          <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
            <el-form-item label="审批人设置" prop="candidateStrategy">
              <el-radio-group
                v-model="configForm.candidateStrategy"
                @change="changeCandidateStrategy"
              >
                <el-radio
                  v-for="(dict, index) in getIntDictOptions(DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY)"
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
                @change="changedCandidateUsers"
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
            <el-form-item label="多人审批方式" prop="approveMethod">
              <el-radio-group v-model="configForm.approveMethod" @change="approveMethodChanged">
                <div class="flex-col">
                  <div
                    v-for="(item, index) in APPROVE_METHODS"
                    :key="index"
                    class="flex items-center"
                  >
                    <el-radio
                      :value="item.value"
                      :label="item.value"
                      :disabled="
                        item.value !== ApproveMethodType.RRANDOM_SELECT_ONE_APPROVE &&
                        notAllowedMultiApprovers
                      "
                    >
                      {{ item.label }}
                    </el-radio>
                    <el-form-item prop="approveRatio">
                      <el-input-number
                        v-model="configForm.approveRatio"
                        :min="10"
                        :max="100"
                        :step="10"
                        size="small"
                        v-if="
                          item.value === ApproveMethodType.APPROVE_BY_RATIO &&
                          configForm.approveMethod === ApproveMethodType.APPROVE_BY_RATIO
                        "
                      />
                    </el-form-item>
                  </div>
                </div>
              </el-radio-group>
            </el-form-item>
            <el-divider content-position="left">审批人拒绝时</el-divider>
            <el-form-item prop="rejectHandlerType">
              <el-radio-group v-model="configForm.rejectHandlerType">
                <div class="flex-col">
                  <div v-for="(item, index) in REJECT_HANDLER_TYPES" :key="index">
                    <el-radio :key="item.value" :value="item.value" :label="item.label" />
                  </div>
                </div>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="configForm.rejectHandlerType == RejectHandlerType.RETURN_USER_TASK"
              label="驳回节点"
              prop="returnNodeId"
            >
              <el-select v-model="configForm.returnNodeId" clearable style="width: 100%">
                <el-option
                  v-for="item in returnTaskList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">审批人超时未处理时</el-divider>
            <el-form-item label="启用开关" prop="timeoutHandlerEnable">
              <el-switch
                v-model="configForm.timeoutHandlerEnable"
                active-text="开启"
                inactive-text="关闭"
                @change="timeoutHandlerChange"
              />
            </el-form-item>
            <el-form-item
              label="执行动作"
              prop="timeoutHandlerAction"
              v-if="configForm.timeoutHandlerEnable"
            >
              <el-radio-group
                v-model="configForm.timeoutHandlerAction"
                @change="timeoutActionChanged"
              >
                <el-radio-button
                  v-for="item in TIMEOUT_HANDLER_ACTION_TYPES"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </el-radio-group>
            </el-form-item>
            <el-form-item label="超时时间设置" v-if="configForm.timeoutHandlerEnable">
              <span class="mr-2">当超过</span>
              <el-form-item prop="timeDuration">
                <el-input-number
                  class="mr-2"
                  :style="{ width: '100px' }"
                  v-model="configForm.timeDuration"
                  :min="1"
                  controls-position="right"
                />
              </el-form-item>
              <el-select
                v-model="timeUnit"
                class="mr-2"
                :style="{ width: '100px' }"
                @change="timeUnitChange"
              >
                <el-option
                  v-for="item in TIME_UNIT_TYPES"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              未处理
            </el-form-item>
            <el-form-item
              label="最大提醒次数"
              prop="maxRemindCount"
              v-if="configForm.timeoutHandlerEnable && configForm.timeoutHandlerAction === 1"
            >
              <el-input-number v-model="configForm.maxRemindCount" :min="1" :max="10" />
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
            v-for="(item, index) in configForm.fieldsPermission"
            :key="index"
          >
            <div class="field-setting-item-label"> {{ item.title }} </div>
            <el-radio-group class="field-setting-item-group" v-model="item.permission">
              <div class="item-radio-wrap">
                <el-radio value="1" size="large" label="1"><span></span></el-radio>
              </div>
              <div class="item-radio-wrap">
                <el-radio value="2" size="large" label="2"><span></span></el-radio>
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
import {
  SimpleFlowNode,
  APPROVE_METHODS,
  CandidateStrategy,
  NodeType,
  ApproveMethodType,
  TimeUnitType,
  RejectHandlerType,
  TIMEOUT_HANDLER_ACTION_TYPES,
  TIME_UNIT_TYPES,
  REJECT_HANDLER_TYPES,
  NODE_DEFAULT_NAME
} from '../consts'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { getDefaultFieldsPermission } from '../utils'
import { defaultProps } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
import { cloneDeep } from 'lodash-es'

defineOptions({
  name: 'UserTaskNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const emits = defineEmits<{
  'find:returnTaskNodes': [nodeList: SimpleFlowNode[]]
}>()

const notAllowedMultiApprovers = ref(false)
const currentNode = ref<SimpleFlowNode>(props.flowNode)
const settingVisible = ref(false)
const roleOptions = inject<Ref<RoleApi.RoleVO[]>>('roleList') // 角色列表
const postOptions = inject<Ref<PostApi.PostVO[]>>('postList') // 岗位列表
const userOptions = inject<Ref<UserApi.UserVO[]>>('userList') // 用户列表
const deptOptions = inject<Ref<DeptApi.DeptVO[]>>('deptList') // 部门列表
const userGroupOptions = inject<Ref<UserGroupApi.UserGroupVO[]>>('userGroupList') // 用户组列表
const deptTreeOptions = inject('deptTree') // 部门树
const formType = inject('formType') // 表单类型
const formFields = inject<Ref<string[]>>('formFields')
const returnTaskList = ref<SimpleFlowNode[]>([])

const formRef = ref() // 表单 Ref
const activeTabName = ref('user') // 激活的 Tab 标签页
const configForm = ref<any>({
  candidateParamArray: [],
  candidateStrategy: CandidateStrategy.USER,
  approveMethod: ApproveMethodType.RRANDOM_SELECT_ONE_APPROVE,
  approveRatio: 100,
  rejectHandlerType: RejectHandlerType.FINISH_PROCESS,
  returnNodeId: '',
  timeoutHandlerEnable: false,
  timeoutHandlerAction: 1,
  timeDuration: 6, // 默认 6小时
  maxRemindCount: 1, // 默认 提醒 1次
  fieldsPermission: []
})
// 表单校验规则
const formRules = reactive({
  candidateStrategy: [{ required: true }],
  candidateParamArray: [{ required: true, message: '该选项不能为空', trigger: 'change' }],
  approveMethod: [{ required: true, message: '多人审批方式不能为空', trigger: 'change' }],
  approveRatio: [{ required: true, message: '通过比例不能为空', trigger: 'blur' }],
  returnNodeId: [{ required: true, message: '驳回节点不能为空', trigger: 'change' }],
  timeoutHandlerEnable: [{ required: true }],
  timeoutHandlerAction: [{ required: true }],
  timeDuration: [{ required: true, message: '超时时间不能为空', trigger: 'blur' }],
  maxRemindCount: [{ required: true, message: '提醒次数不能为空', trigger: 'blur' }]
})
// 关闭
const closeDrawer = () => {
  settingVisible.value = false
}
// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'user'
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.candidateStrategy = configForm.value.candidateStrategy
  currentNode.value.candidateParam = configForm.value.candidateParamArray?.join(',')
  // 设置审批方式
  currentNode.value.approveMethod = configForm.value.approveMethod
  if (configForm.value.approveMethod === ApproveMethodType.APPROVE_BY_RATIO) {
    currentNode.value.approveRatio = configForm.value.approveRatio
  }
  // 设置拒绝处理
  currentNode.value.rejectHandler = {
    type: configForm.value.rejectHandlerType,
    returnNodeId: configForm.value.returnNodeId
  }
  // 设置超时处理
  currentNode.value.timeoutHandler = {
    enable: configForm.value.timeoutHandlerEnable,
    action: cTimeoutAction.value,
    timeDuration: isoTimeDuration.value,
    maxRemindCount: cTimeoutMaxRemindCount.value
  }
  // 设置表单权限
  currentNode.value.fieldsPermission = configForm.value.fieldsPermission

  currentNode.value.showText = getShowText()
  settingVisible.value = false
  return true
}
const getShowText = (): string => {
  let showText = ''
  // 指定成员
  if (configForm.value.candidateStrategy === CandidateStrategy.USER) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      userOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.nickname)
        }
      })
      showText = `指定成员：${candidateNames.join(',')}`
    }
  }
  // 指定角色
  if (configForm.value.candidateStrategy === CandidateStrategy.ROLE) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      roleOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定角色：${candidateNames.join(',')}`
    }
  }
  // 指定部门
  if (
    configForm.value.candidateStrategy === CandidateStrategy.DEPT_MEMBER ||
    configForm.value.candidateStrategy === CandidateStrategy.DEPT_LEADER
  ) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      deptOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      if (configForm.value.candidateStrategy === CandidateStrategy.DEPT_MEMBER) {
        showText = `部门成员：${candidateNames.join(',')}`
      } else {
        showText = `部门的负责人：${candidateNames.join(',')}`
      }
    }
  }

  // 指定岗位
  if (configForm.value.candidateStrategy === CandidateStrategy.POST) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      postOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定岗位: ${candidateNames.join(',')}`
    }
  }
  // 指定用户组
  if (configForm.value.candidateStrategy === CandidateStrategy.USER_GROUP) {
    if (configForm.value.candidateParamArray?.length > 0) {
      const candidateNames: string[] = []
      userGroupOptions?.value.forEach((item) => {
        if (configForm.value.candidateParamArray.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定用户组: ${candidateNames.join(',')}`
    }
  }

  // 发起人自选
  if (configForm.value.candidateStrategy === CandidateStrategy.START_USER_SELECT) {
    showText = `发起人自选`
  }
  // 发起人自己
  if (configForm.value.candidateStrategy === CandidateStrategy.START_USER) {
    showText = `发起人自己`
  }

  // 流程表达式
  if (configForm.value.candidateStrategy === CandidateStrategy.EXPRESSION) {
    if (configForm.value.candidateParamArray?.length > 0) {
      showText = `流程表达式：${configForm.value.candidateParamArray[0]}`
    }
  }
  return showText
}
const open = () => {
  settingVisible.value = true
}
//  修改当前编辑的节点， 由父组件传过来
const setCurrentNode = (node: SimpleFlowNode) => {
  currentNode.value = node
  configForm.value.fieldsPermission =
    cloneDeep(node.fieldsPermission) || getDefaultFieldsPermission(formFields?.value)
  configForm.value.candidateStrategy = node.candidateStrategy
  const strCandidateParam = node?.candidateParam
  if (node.candidateStrategy === CandidateStrategy.EXPRESSION) {
    configForm.value.candidateParamArray[0] = strCandidateParam
  } else {
    if (strCandidateParam) {
      configForm.value.candidateParamArray = strCandidateParam.split(',').map((item) => +item)
    }
    configForm.value.candidateStrategy = node.candidateStrategy
  }
  if (
    (configForm.value.candidateParamArray?.length <= 1 &&
      node.candidateStrategy === CandidateStrategy.USER) ||
    node.candidateStrategy === CandidateStrategy.START_USER
  ) {
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
  // 设置审批方式
  configForm.value.approveMethod = node.approveMethod
  if (node.approveMethod == ApproveMethodType.APPROVE_BY_RATIO) {
    configForm.value.approveRatio = node.approveRatio
  }
  configForm.value.rejectHandlerType = node.rejectHandler?.type
  configForm.value.returnNodeId = node.rejectHandler?.returnNodeId
  configForm.value.timeoutHandlerEnable = node.timeoutHandler?.enable
  if (node.timeoutHandler?.enable && node.timeoutHandler?.timeDuration) {
    const strTimeDuration = node.timeoutHandler.timeDuration
    let parseTime = strTimeDuration.slice(2, strTimeDuration.length - 1)
    let parseTimeUnit = strTimeDuration.slice(strTimeDuration.length - 1)
    configForm.value.timeDuration = parseInt(parseTime)
    timeUnit.value = convertTimeUnit(parseTimeUnit)
  }
  configForm.value.timeoutHandlerAction = node.timeoutHandler?.action
  configForm.value.maxRemindCount = node.timeoutHandler?.maxRemindCount
  // 查找可以驳回的用户节点
  const matchNodeList = []
  emits('find:returnTaskNodes', matchNodeList)
  returnTaskList.value = matchNodeList
}

defineExpose({ open, setCurrentNode }) // 暴露方法给父组件

const changeCandidateStrategy = () => {
  configForm.value.candidateParamArray = []
  configForm.value.approveMethod = ApproveMethodType.RRANDOM_SELECT_ONE_APPROVE
  if (
    configForm.value.candidateStrategy === CandidateStrategy.START_USER ||
    configForm.value.candidateStrategy === CandidateStrategy.USER
  ) {
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
}

const changedCandidateUsers = () => {
  if (
    configForm.value.candidateParamArray?.length <= 1 &&
    configForm.value.candidateStrategy === CandidateStrategy.USER
  ) {
    configForm.value.approveMethod = ApproveMethodType.RRANDOM_SELECT_ONE_APPROVE
    configForm.value.rejectHandlerType = RejectHandlerType.FINISH_PROCESS
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
}
// 显示名称输入框
const showInput = ref(false)

const clickIcon = () => {
  showInput.value = true
}
// 节点名称输入框失去焦点
const blurEvent = () => {
  showInput.value = false
  currentNode.value.name =
    currentNode.value.name || (NODE_DEFAULT_NAME.get(NodeType.USER_TASK_NODE) as string)
}
const approveMethodChanged = () => {
  configForm.value.rejectHandlerType = RejectHandlerType.FINISH_PROCESS
  if (configForm.value.approveMethod === ApproveMethodType.APPROVE_BY_RATIO) {
    configForm.value.approveRatio = 100
  }
  formRef.value.clearValidate('approveRatio')
}

const timeUnit = ref(TimeUnitType.HOUR)

// 超时时间的 ISO 表示
const isoTimeDuration = computed(() => {
  if (!configForm.value.timeoutHandlerEnable) {
    return undefined
  }
  let strTimeDuration = 'PT'
  if (timeUnit.value === TimeUnitType.MINUTE) {
    strTimeDuration += configForm.value.timeDuration + 'M'
  }
  if (timeUnit.value === TimeUnitType.HOUR) {
    strTimeDuration += configForm.value.timeDuration + 'H'
  }
  if (timeUnit.value === TimeUnitType.DAY) {
    strTimeDuration += configForm.value.timeDuration + 'D'
  }
  return strTimeDuration
})
// 超时执行的动作
const cTimeoutAction = computed(() => {
  if (!configForm.value.timeoutHandlerEnable) {
    return undefined
  }
  return configForm.value.timeoutHandlerAction
})
// 超时最大提醒次数
const cTimeoutMaxRemindCount = computed(() => {
  if (!configForm.value.timeoutHandlerEnable) {
    return undefined
  }
  if (configForm.value.timeoutHandlerAction !== 1) {
    return undefined
  }
  return configForm.value.maxRemindCount
})

// 超时开关改变
const timeoutHandlerChange = () => {
  if (configForm.value.timeoutHandlerEnable) {
    timeUnit.value = 2
    configForm.value.timeDuration = 6
    configForm.value.timeoutHandlerAction = 1
    configForm.value.maxRemindCount = 1
  }
}
// 超时处理动作改变
const timeoutActionChanged = () => {
  if (configForm.value.timeoutHandlerAction === 1) {
    configForm.value.maxRemindCount = 1 // 超时提醒次数，默认为1
  }
}

// 时间单位改变
const timeUnitChange = () => {
  // 分钟，默认是 60 分钟
  if (timeUnit.value === TimeUnitType.MINUTE) {
    configForm.value.timeDuration = 60
  }
  // 小时，默认是 6 个小时
  if (timeUnit.value === TimeUnitType.HOUR) {
    configForm.value.timeDuration = 6
  }
  // 天， 默认 1天
  if (timeUnit.value === TimeUnitType.DAY) {
    configForm.value.timeDuration = 1
  }
}

const convertTimeUnit = (strTimeUnit: string) => {
  if (strTimeUnit === 'M') {
    return TimeUnitType.MINUTE
  }
  if (strTimeUnit === 'H') {
    return TimeUnitType.HOUR
  }
  if (strTimeUnit === 'D') {
    return TimeUnitType.DAY
  }
  return TimeUnitType.HOUR
}
</script>

<style lang="scss" scoped></style>
