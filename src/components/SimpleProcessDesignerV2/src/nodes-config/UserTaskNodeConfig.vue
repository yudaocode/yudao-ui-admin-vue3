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
        <div v-else class="node-name" >{{ currentNode.name }} <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()"/></div>
        
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
              <el-radio-group v-model="currentNode.attributes.approveMethod">
                <div class="flex-col">
                  <div v-for="(item, index) in APPROVE_METHODS" :key="index">
                    <el-radio
                      :value="item.value"
                      :label="item.value"
                      :disabled="item.value !== 1 && notAllowedMultiApprovers"
                    >
                      {{ item.label }}
                    </el-radio>
                  </div>
                </div>
              </el-radio-group>
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
import { SimpleFlowNode, APPROVE_METHODS, CandidateStrategy, NodeType, NODE_DEFAULT_NAME } from '../consts'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
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
  'update:modelValue': [node: SimpleFlowNode]
}>()
const notAllowedMultiApprovers = ref(false)
const currentNode = ref<SimpleFlowNode>(props.flowNode)
const settingVisible = ref(false)
const roleOptions = inject<Ref<RoleApi.RoleVO[]>>('roleList') // 角色列表
const postOptions = inject<Ref<PostApi.PostVO[]>>('postList') // 岗位列表
const userOptions = inject<Ref<UserApi.UserVO[]>>('userList') // 用户列表
const deptOptions = inject<Ref<DeptApi.DeptVO[]>>('deptList')  // 部门列表
const userGroupOptions = inject<Ref<UserGroupApi.UserGroupVO[]>>('userGroupList') // 用户组列表
const deptTreeOptions = inject('deptTree') // 部门树
const candidateParamArray = ref<any[]>([])

const closeDrawer = () => {
  settingVisible.value = false
}
const saveConfig = () => {
  currentNode.value.attributes.candidateParam = candidateParamArray.value?.join(',')
  currentNode.value.showText = getShowText()
  console.log('currentNode value is ', currentNode.value)
  emits('update:modelValue', currentNode.value)
  settingVisible.value = false
}
const getShowText = () : string => {
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
      console.log("candidateNames is ", candidateNames)
      showText = `指定成员：${candidateNames.join(',')}`
    }
  }
  // 指定角色
  if (currentNode.value.attributes.candidateStrategy === 10) {
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
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.DEPT_MEMBER 
      || currentNode.value.attributes.candidateStrategy === CandidateStrategy.DEPT_LEADER ) {
    if (candidateParamArray.value?.length > 0) {
      const candidateNames: string[] = []
      deptOptions?.value.forEach((item) => {
        if (candidateParamArray.value.includes(item.id)) {
          candidateNames.push(item.name)
        }
      })
      if(currentNode.value.attributes.candidateStrategy === CandidateStrategy.DEPT_MEMBER){
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
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.START_USER_SELECT ) {
    showText = `发起人自选`
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
defineExpose({ open }) // 提供 open 方法，用于打开抽屉
const changeCandidateStrategy = () => {
  candidateParamArray.value = []
  currentNode.value.attributes.approveMethod = 1
  if (currentNode.value.attributes.candidateStrategy === CandidateStrategy.USER) {
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
}

const changedCandidateUsers = () => {
  if (candidateParamArray.value?.length <= 1 && currentNode.value.attributes?.candidateStrategy === CandidateStrategy.USER) {
    currentNode.value.attributes.approveMethod = 1;
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
}
// 显示名称输入框
const showInput = ref(false)

const clickIcon = () => {
  showInput.value = true;
}
// 节点名称输入框失去焦点
const blurEvent = () => {
  showInput.value = false
  currentNode.value.name = currentNode.value.name || NODE_DEFAULT_NAME.get(NodeType.USER_TASK_NODE) as string
}
onMounted(async () => {
  candidateParamArray.value = currentNode.value.attributes?.candidateParam?.split(',').map(item=> +item)
  console.log('candidateParamArray.value', candidateParamArray.value)
  if (currentNode.value.attributes?.candidateStrategy === CandidateStrategy.USER && candidateParamArray.value?.length <= 1) {
    notAllowedMultiApprovers.value = true
  } else {
    notAllowedMultiApprovers.value = false
  }
})
</script>

<style lang="scss" scoped>
</style>
