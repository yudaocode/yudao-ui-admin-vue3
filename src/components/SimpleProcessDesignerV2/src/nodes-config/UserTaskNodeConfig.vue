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
    <el-tabs type="border-card">
      <el-tab-pane label="审批人">
        <div>
          <el-form label-position="top">
            <el-form-item label="审批人设置" prop="candidateStrategy">
              <el-radio-group
                v-model="currentNode.attributes.candidateStrategy"
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
              v-if="currentNode.attributes.candidateStrategy == CandidateStrategy.ROLE"
              label="指定角色"
              prop="candidateParam"
            >
              <el-select v-model="candidateParamArray" clearable multiple style="width: 100%">
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
                currentNode.attributes.candidateStrategy == CandidateStrategy.DEPT_MEMBER ||
                currentNode.attributes.candidateStrategy == CandidateStrategy.DEPT_LEADER
              "
              label="指定部门"
              prop="candidateParam"
              span="24"
            >
              <el-tree-select
                ref="treeRef"
                v-model="candidateParamArray"
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
              v-if="currentNode.attributes.candidateStrategy == CandidateStrategy.POST"
              label="指定岗位"
              prop="candidateParam"
              span="24"
            >
              <el-select v-model="candidateParamArray" clearable multiple style="width: 100%">
                <el-option
                  v-for="item in postOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="currentNode.attributes.candidateStrategy == CandidateStrategy.USER"
              label="指定用户"
              prop="candidateParam"
              span="24"
            >
              <el-select
                v-model="candidateParamArray"
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
              v-if="currentNode.attributes.candidateStrategy === CandidateStrategy.USER_GROUP"
              label="指定用户组"
              prop="candidateParam"
            >
              <el-select v-model="candidateParamArray" clearable multiple style="width: 100%">
                <el-option
                  v-for="item in userGroupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="currentNode.attributes.candidateStrategy === CandidateStrategy.EXPRESSION"
              label="流程表达式"
              prop="candidateParam"
            >
              <el-input
                type="textarea"
                v-model="candidateParamArray[0]"
                clearable
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="审批方式" prop="approveMethod">
              <el-radio-group
                v-model="currentNode.attributes.approveMethod"
                @change="approveMethodChanged"
              >
                <div class="flex-col">
                  <div v-for="(item, index) in APPROVE_METHODS" :key="index" class="flex items-center">
                    <el-radio
                      :value="item.value"
                      :label="item.value"
                      :disabled="
                        item.value !== ApproveMethodType.SINGLE_PERSON_APPROVE &&
                        notAllowedMultiApprovers
                      "
                    >
                      {{ item.label }}
                    </el-radio>
                    <el-input-number
                      v-model="currentNode.attributes.approveRatio"
                      :min="10"
                      :max="99"
                      :step="10"
                      size="small"
                      v-if="item.value === ApproveMethodType.APPROVE_BY_RATIO && currentNode.attributes.approveMethod === ApproveMethodType.APPROVE_BY_RATIO"
                    />
                  </div>
                </div>
              </el-radio-group>
            </el-form-item>
            <el-divider content-position="left">审批人拒绝时</el-divider>
            <el-form-item prop="rejectHandler">
              <el-radio-group v-model="currentNode.attributes.rejectHandler.type">
                <div class="flex-col">
                  <div v-for="(item, index) in REJECT_HANDLER_TYPES" :key="index">
                    <el-radio
                      :key="item.value"
                      :value="item.value"
                      :label="item.label"
                      :disabled="rejectHandlerOptionDisabled(item.value)"
                    />
                   
                  </div>
                </div>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="
                currentNode.attributes.rejectHandler.type == RejectHandlerType.RETURN_PRE_USER_TASK
              "
              label="驳回节点"
              prop="rejectHandlerNode"
            >
              <el-select
                v-model="currentNode.attributes.rejectHandler.returnNodeId"
                clearable
                style="width: 100%"
              >
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
                v-model="currentNode.attributes.timeoutHandler.enable"
                active-text="开启"
                inactive-text="关闭"
                @change="timeoutHandlerChange"
              />
            </el-form-item>
            <el-form-item
              label="执行动作"
              prop="timeoutHandlerAction"
              v-if="currentNode.attributes.timeoutHandler.enable"
            >
              <el-radio-group v-model="currentNode.attributes.timeoutHandler.action">
                <el-radio-button
                  v-for="item in TIMEOUT_HANDLER_ACTION_TYPES"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </el-radio-group>
            </el-form-item>
            <el-form-item
              label="超时时间设置"
              prop="timeoutHandlerTimeDuration"
              v-if="currentNode.attributes.timeoutHandler.enable"
            >
              <span class="mr-2">当超过</span>
              <el-input-number
                class="mr-2"
                :style="{ width: '100px' }"
                v-model="timeDuration"
                :min="1"
                controls-position="right"
              />
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
              prop="timeoutHandlerMaxRemindCount"
              v-if="
                currentNode.attributes.timeoutHandler.enable &&
                currentNode.attributes.timeoutHandler.action === 1
              "
            >
              <el-input-number
                v-model="currentNode.attributes.timeoutHandler.maxRemindCount"
                :min="1"
                :max="10"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane label="表单字段权限" v-if="formType === 10">
        <div class="field-setting-pane">
          <div class="field-setting-desc">字段权限</div>
          <div class="field-permit-title">
            <div class="setting-title-label first-title"> 字段名称 </div>
            <div class="other-titles">
              <span class="setting-title-label">可编辑</span>
              <span class="setting-title-label">只读</span>
              <span class="setting-title-label">隐藏</span>
            </div>
          </div>
          <div
            class="field-setting-item"
            v-for="(item, index) in currentNode.attributes.fieldsPermission"
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
const candidateParamArray = ref<any[]>([])
const returnTaskList = ref<SimpleFlowNode[]>([])
const closeDrawer = () => {
  settingVisible.value = false
}
const saveConfig = () => {
  currentNode.value.attributes.candidateParam = candidateParamArray.value?.join(',')
  if (currentNode.value.attributes.timeoutHandler.enable) {
    currentNode.value.attributes.timeoutHandler.timeDuration = isoTimeDuration.value
  }
  currentNode.value.showText = getShowText()
  settingVisible.value = false
}
const getShowText = (): string => {
  let showText = ''
  // 指定成员
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.USER) {
    if (candidateParamArray.value?.length > 0) {
      const candidateNames: string[] = []
      userOptions?.value.forEach((item) => {
        if (candidateParamArray.value.includes(item.id)) {
          candidateNames.push(item.nickname)
        }
      })
      showText = `指定成员：${candidateNames.join(',')}`
    }
  }
  // 指定角色
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.ROLE) {
    if (candidateParamArray.value?.length > 0) {
      const candidateNames: string[] = []
      roleOptions?.value.forEach((item) => {
        if (candidateParamArray.value.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定角色：${candidateNames.join(',')}`
    }
  }
  // 指定部门
  if (
    currentNode.value.attributes.candidateStrategy === CandidateStrategy.DEPT_MEMBER ||
    currentNode.value.attributes.candidateStrategy === CandidateStrategy.DEPT_LEADER
  ) {
    if (candidateParamArray.value?.length > 0) {
      const candidateNames: string[] = []
      deptOptions?.value.forEach((item) => {
        if (candidateParamArray.value.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.DEPT_MEMBER) {
        showText = `部门成员：${candidateNames.join(',')}`
      } else {
        showText = `部门的负责人：${candidateNames.join(',')}`
      }
    }
  }

  // 指定岗位
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.POST) {
    if (candidateParamArray.value?.length > 0) {
      const candidateNames: string[] = []
      postOptions?.value.forEach((item) => {
        if (candidateParamArray.value.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定岗位: ${candidateNames.join(',')}`
    }
  }
  // 指定用户组
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.USER_GROUP) {
    if (candidateParamArray.value?.length > 0) {
      const candidateNames: string[] = []
      userGroupOptions?.value.forEach((item) => {
        if (candidateParamArray.value.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      showText = `指定用户组: ${candidateNames.join(',')}`
    }
  }

  // 发起人自选
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.START_USER_SELECT) {
    showText = `发起人自选`
  }
  // 发起人自己
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.START_USER) {
    showText = `发起人自己`
  }

  // 流程表达式
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.EXPRESSION) {
    if (candidateParamArray.value?.length > 0) {
      showText = `流程表达式：${candidateParamArray.value[0]}`
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
  currentNode.value.attributes.fieldsPermission =
    node.attributes.fieldsPermission || getDefaultFieldsPermission(formFields?.value)
  const strCandidateParam = node.attributes?.candidateParam
  if (strCandidateParam) {
    candidateParamArray.value = strCandidateParam.split(',').map((item) => +item)
  }
  if (currentNode.value.attributes?.candidateStrategy === CandidateStrategy.START_USER) {
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
  if (
    currentNode.value.attributes?.timeoutHandler?.enable &&
    currentNode.value.attributes?.timeoutHandler?.timeDuration
  ) {
    const strTimeDuration = currentNode.value.attributes.timeoutHandler.timeDuration
    let parseTime = strTimeDuration.slice(2, strTimeDuration.length - 1)
    let parseTimeUnit = strTimeDuration.slice(strTimeDuration.length - 1)
    timeDuration.value = parseInt(parseTime)
    timeUnit.value = convertTimeUnit(parseTimeUnit)
  }
  // 查找可以驳回的用户节点
  const matchNodeList = []
  emits('find:returnTaskNodes', matchNodeList)
  returnTaskList.value = matchNodeList
}

defineExpose({ open, setCurrentNode }) // 暴露方法给父组件

const changeCandidateStrategy = () => {
  candidateParamArray.value = []
  currentNode.value.attributes.approveMethod = ApproveMethodType.SINGLE_PERSON_APPROVE
  if (
    currentNode.value.attributes.candidateStrategy === CandidateStrategy.START_USER ||
    currentNode.value.attributes.candidateStrategy === CandidateStrategy.USER
  ) {
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
}

const changedCandidateUsers = () => {
  if (
    candidateParamArray.value?.length <= 1 &&
    currentNode.value.attributes?.candidateStrategy === CandidateStrategy.USER
  ) {
    currentNode.value.attributes.approveMethod = ApproveMethodType.SINGLE_PERSON_APPROVE
    currentNode.value.attributes.rejectHandler.type = RejectHandlerType.FINISH_PROCESS
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
  const approveMethod = currentNode.value.attributes?.approveMethod
  if ( approveMethod === ApproveMethodType.ANY_APPROVE_ALL_REJECT || approveMethod === ApproveMethodType.APPROVE_BY_RATIO) {
    currentNode.value.attributes.rejectHandler.type =
    RejectHandlerType.FINISH_PROCESS_BY_REJECT_RATIO
  } else {
    currentNode.value.attributes.rejectHandler.type = RejectHandlerType.FINISH_PROCESS
  }

  if (approveMethod === ApproveMethodType.APPROVE_BY_RATIO) {
    currentNode.value.attributes.approveRatio = 50;
  }
}
const rejectHandlerOptionDisabled = computed(() => {
  return (val: number) => {
    const approveMethod = currentNode.value.attributes?.approveMethod
    if (
      val === RejectHandlerType.FINISH_PROCESS_BY_REJECT_RATIO &&
      approveMethod !== ApproveMethodType.APPROVE_BY_RATIO &&
      approveMethod !== ApproveMethodType.ANY_APPROVE_ALL_REJECT
    ) {
      return true
    }
    if (
      approveMethod === ApproveMethodType.ANY_APPROVE_ALL_REJECT &&
      val === RejectHandlerType.FINISH_PROCESS
    ) {
      return true
    }

    return false
  }
})
// 默认 6小时
const timeDuration = ref(6)
const timeUnit = ref(TimeUnitType.HOUR)

const isoTimeDuration = computed(() => {
  let strTimeDuration = 'PT'
  if (timeUnit.value === TimeUnitType.MINUTE) {
    strTimeDuration += timeDuration.value + 'M'
  }
  if (timeUnit.value === TimeUnitType.HOUR) {
    strTimeDuration += timeDuration.value + 'H'
  }
  if (timeUnit.value === TimeUnitType.DAY) {
    strTimeDuration += timeDuration.value + 'D'
  }
  return strTimeDuration
})

// 超时开关改变
const timeoutHandlerChange = () => {
  if (currentNode.value.attributes.timeoutHandler.enable) {
    timeUnit.value = 2
    timeDuration.value = 6
    currentNode.value.attributes.timeoutHandler.action = 1
    currentNode.value.attributes.timeoutHandler.maxRemindCount = 1
  }
}

// 时间单位改变
const timeUnitChange = () => {
  // 分钟，默认是 60 分钟
  if (timeUnit.value === TimeUnitType.MINUTE) {
    timeDuration.value = 60
  }
  // 小时，默认是 6 个小时
  if (timeUnit.value === TimeUnitType.HOUR) {
    timeDuration.value = 6
  }
  // 天， 默认 1天
  if (timeUnit.value === TimeUnitType.DAY) {
    timeDuration.value = 1
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
