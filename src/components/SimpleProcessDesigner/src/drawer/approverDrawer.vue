<template>
  <el-drawer
    :append-to-body="true"
    v-model="visible"
    class="set_promoter"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
  >
    <template #header>
      <div class="user-task-header">审批设置</div>
    </template>
    <div>
      <el-form label-position="top" label-width="100px">
        <el-form-item label="审批方式" prop="approveMethod">
          <el-select v-model="candidateConfig.approveMethod" style="width: 100%" clearable>
            <el-option
              v-for="dict in approveMethods"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="审批人规则类型" prop="candidateStrategy">
          <el-select v-model="candidateConfig.candidateStrategy" style="width: 100%" clearable @change="changecandidateStrategy">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="candidateConfig.candidateStrategy == 10"
          label="指定角色"
          prop="candidateParam"
        >
          <el-select
            v-model="candidateConfig.candidateParam"
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
          v-if="candidateConfig.candidateStrategy == 20 || candidateConfig.candidateStrategy == 21"
          label="指定部门"
          prop="candidateParam"
          span="24"
        >
          <el-tree-select
            ref="treeRef"
            v-model="candidateConfig.candidateParam"
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
          v-if="candidateConfig.candidateStrategy == 22"
          label="指定岗位"
          prop="candidateParam"
          span="24"
        >
          <el-select
            v-model="candidateConfig.candidateParam"
            clearable
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="item in postOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="
            candidateConfig.candidateStrategy == 30 ||
            candidateConfig.candidateStrategy == 31 ||
            candidateConfig.candidateStrategy == 32
          "
          label="指定用户"
          prop="candidateParam"
          span="24"
        >
          <el-select
            v-model="candidateConfig.candidateParam"
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
          v-if="candidateConfig.candidateStrategy === 40"
          label="指定用户组"
          prop="candidateParam"
        >
          <el-select
            v-model="candidateConfig.candidateParam"
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
          v-if="candidateConfig.candidateStrategy === 60"
          label="流程表达式"
          prop="candidateParam"
        >
          <el-input
            type="textarea"
            v-model="candidateConfig.candidateParam[0]"
            clearable
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="demo-drawer__footer clear">
      <el-button type="primary" @click="saveConfig">确 定</el-button>
      <el-button @click="closeDrawer">取 消</el-button>
    </div>
  </el-drawer>
</template>
<script lang="ts" setup>
import { ref, watch, computed, toRaw } from 'vue'
import { approveMethods, setApproverStr } from '../util'
import { useWorkFlowStoreWithOut } from '@/store/modules/simpleWorkflow'
import { DICT_TYPE, getIntDictOptions, getDictLabel } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
let props = defineProps({
  directorMaxLevel: {
    type: Number,
    default: 0
  }
})
const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const deptTreeOptions = ref() // 部门树
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
const candidateConfig = ref({
  candidateStrategy: undefined,
  candidateParam: [],
  approveMethod: undefined
})
let approverConfig = ref({})
let approverVisible = ref(false)
let approverRoleVisible = ref(false)
let checkedRoleList = ref([])
let checkedList = ref([])
let store = useWorkFlowStoreWithOut()
let { setApproverConfig, setApprover, setUserTaskConfig } = store
let approverConfig1 = computed(() => store.approverConfig1)
let approverDrawer = computed(() => store.approverDrawer)
const userTaskConfig = computed(() => store.userTaskConfig)

let visible = computed({
  get() {
    return approverDrawer.value
  },
  set() {
    closeDrawer()
  }
})
watch(userTaskConfig, (val) => {
  if (val.value.attributes) {
    candidateConfig.value = val.value.attributes
  }
})
watch(approverConfig1, (val) => {
  approverConfig.value = val.value
})
let changeRange = () => {
  approverConfig.value.nodeUserList = []
}
const changeType = (val) => {
  approverConfig.value.nodeUserList = []
  approverConfig.value.examineMode = 1
  approverConfig.value.noHanderAction = 2
  if (val == 2) {
    approverConfig.value.directorLevel = 1
  } else if (val == 4) {
    approverConfig.value.selectMode = 1
    approverConfig.value.selectRange = 1
  } else if (val == 7) {
    approverConfig.value.examineEndDirectorLevel = 1
  }
}
const addApprover = () => {
  approverVisible.value = true
  checkedList.value = approverConfig.value.nodeUserList
}
const addRoleApprover = () => {
  approverRoleVisible.value = true
  checkedRoleList.value = approverConfig.value.nodeUserList
}
const sureApprover = (data) => {
  approverConfig.value.nodeUserList = data
  approverVisible.value = false
}
const sureRoleApprover = (data) => {
  approverConfig.value.nodeUserList = data
  approverRoleVisible.value = false
}
const saveApprover = () => {
  approverConfig.value.error = !setApproverStr(approverConfig.value)
  setApproverConfig({
    value: approverConfig.value,
    flag: true,
    id: approverConfig1.value.id
  })
  closeDrawer()
}
const saveConfig = () => {
  console.log('before userTaskConfig is ', userTaskConfig.value.id)
  const rawConfig = toRaw(userTaskConfig.value)
  rawConfig.value.attributes = toRaw(candidateConfig.value)
  rawConfig.flag = true
  // TODO 进行校验
  // setApproverConfig({
  //     value: approverConfig.value,
  //     flag: true,
  //     id: approverConfig1.value.id
  // })
  const showText = getApproverShowText()
  setUserTaskConfig({
    value: rawConfig.value,
    flag: true,
    id: userTaskConfig.value.id,
    showText
  })
  console.log('after is userTaskConfig', userTaskConfig.value)
  closeDrawer()
}
const getApproverShowText = () => {
  let appoveMethodText = ''
  approveMethods.forEach((item) => {
    if (item.value == candidateConfig.value.approveMethod) {
      appoveMethodText = item.label
    }
  })
  const strategyText = getDictLabel(
    DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY,
    candidateConfig.value.candidateStrategy
  )
  return `审批方式：${appoveMethodText} <br/>
          审批人规则类型：按${strategyText}`
}
const closeDrawer = () => {
  setApprover(false)
}
const changecandidateStrategy = () => {
  candidateConfig.value.candidateParam = []
}
onMounted(async () => {
  // 获得角色列表
  roleOptions.value = await RoleApi.getSimpleRoleList()

  postOptions.value = await PostApi.getSimplePostList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 获得部门列表
  const deptOptions = await DeptApi.getSimpleDeptList()
  deptTreeOptions.value = handleTree(deptOptions, 'id')
  // 获得用户组列表
  userGroupOptions.value = await UserGroupApi.getUserGroupSimpleList()
})
</script>
<style lang="scss" scoped>
.user-task-header {
  font-size: 16px !important;
}
</style>
