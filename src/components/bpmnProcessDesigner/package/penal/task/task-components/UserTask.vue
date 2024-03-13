<template>
  <el-form label-width="100px">
    <el-form-item label="规则类型" prop="assignType">
      <el-select
        v-model="userTaskForm.assignType"
        clearable
        style="width: 100%"
        @change="changeAssignType"
      >
        <el-option
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_TASK_ASSIGN_RULE_TYPE)"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="userTaskForm.assignType == 10" label="指定角色" prop="assignOptions">
      <el-select
        v-model="userTaskForm.assignOptions"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option v-for="item in roleOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.assignType == 20 || userTaskForm.assignType == 21"
      label="指定部门"
      prop="assignOptions"
      span="24"
    >
      <el-tree-select
        ref="treeRef"
        v-model="userTaskForm.assignOptions"
        :data="deptTreeOptions"
        :props="defaultProps"
        empty-text="加载中，请稍后"
        multiple
        node-key="id"
        show-checkbox
        @change="updateElementTask"
      />
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.assignType == 22"
      label="指定岗位"
      prop="assignOptions"
      span="24"
    >
      <el-select
        v-model="userTaskForm.assignOptions"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option v-for="item in postOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="
        userTaskForm.assignType == 30 ||
        userTaskForm.assignType == 31 ||
        userTaskForm.assignType == 32
      "
      label="指定用户"
      prop="assignOptions"
      span="24"
    >
      <el-select
        v-model="userTaskForm.assignOptions"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option
          v-for="item in userOptions"
          :key="item.id"
          :label="item.nickname"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="userTaskForm.assignType === 40" label="指定用户组" prop="assignOptions">
      <el-select
        v-model="userTaskForm.assignOptions"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option
          v-for="item in userGroupOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="userTaskForm.assignType === 50" label="指定脚本" prop="assignOptions">
      <el-select
        v-model="userTaskForm.assignOptions"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option
          v-for="dict in taskAssignScriptDictDatas"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'

defineOptions({ name: 'UserTask' })
const props = defineProps({
  id: String,
  type: String
})
const userTaskForm = ref({
  assignType: undefined, // 分配规则
  assignOptions: [] // 分配选项
})
// const mockData=ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
const bpmnElement = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const deptTreeOptions = ref() // 部门树
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
const taskAssignScriptDictDatas = getIntDictOptions(DICT_TYPE.BPM_TASK_ASSIGN_SCRIPT)

const resetTaskForm = () => {
  const businessObject = bpmnElement.value.businessObject
  if (!businessObject) {
    return
  }
  if (businessObject.assignType != undefined) {
    userTaskForm.value.assignType = parseInt(businessObject.assignType) as any
  } else {
    userTaskForm.value.assignType = undefined
  }
  if (businessObject.assignOptions && businessObject.assignOptions.length > 0) {
    userTaskForm.value.assignOptions = businessObject.assignOptions?.split(',').map((item) => +item)
  } else {
    userTaskForm.value.assignOptions = []
  }
}

/** 更新 assignType 字段时，需要清空 assignOptions，并触发 bpmn 图更新 */
const changeAssignType = () => {
  userTaskForm.value.assignOptions = []
  updateElementTask()
}

/** 选中某个 options 时候，更新 bpmn 图  */
const updateElementTask = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    assignType: userTaskForm.value.assignType,
    assignOptions: userTaskForm.value.assignOptions.join(',')
  })
}

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement
    nextTick(() => {
      resetTaskForm()
    })
  },
  { immediate: true }
)

onMounted(async () => {
  // 获得角色列表
  roleOptions.value = await RoleApi.getSimpleRoleList()
  // 获得部门列表
  const deptOptions = await DeptApi.getSimpleDeptList()
  deptTreeOptions.value = handleTree(deptOptions, 'id')
  // 获得岗位列表
  postOptions.value = await PostApi.getSimplePostList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 获得用户组列表
  userGroupOptions.value = await UserGroupApi.getSimpleUserGroupList()
})

onBeforeUnmount(() => {
  bpmnElement.value = null
})
</script>
