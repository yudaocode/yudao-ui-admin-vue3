<template>
  <el-form label-width="100px">
    <el-form-item label="规则类型" prop="candidateStrategy">
      <el-select
        v-model="userTaskForm.candidateStrategy"
        clearable
        style="width: 100%"
        @change="changeCandidateStrategy"
      >
        <el-option
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_TASK_CANDIDATE_STRATEGY)"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.candidateStrategy == 10"
      label="指定角色"
      prop="candidateParam"
    >
      <el-select
        v-model="userTaskForm.candidateParam"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option v-for="item in roleOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.candidateStrategy == 20 || userTaskForm.candidateStrategy == 21"
      label="指定部门"
      prop="candidateParam"
      span="24"
    >
      <el-tree-select
        ref="treeRef"
        v-model="userTaskForm.candidateParam"
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
      v-if="userTaskForm.candidateStrategy == 22"
      label="指定岗位"
      prop="candidateParam"
      span="24"
    >
      <el-select
        v-model="userTaskForm.candidateParam"
        clearable
        multiple
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option v-for="item in postOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.candidateStrategy == 30"
      label="指定用户"
      prop="candidateParam"
      span="24"
    >
      <el-select
        v-model="userTaskForm.candidateParam"
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
    <el-form-item
      v-if="userTaskForm.candidateStrategy === 40"
      label="指定用户组"
      prop="candidateParam"
    >
      <el-select
        v-model="userTaskForm.candidateParam"
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
    <el-form-item
      v-if="userTaskForm.candidateStrategy === 60"
      label="流程表达式"
      prop="candidateParam"
    >
      <el-input
        type="textarea"
        v-model="userTaskForm.candidateParam[0]"
        clearable
        style="width: 72%"
        @change="updateElementTask"
      />
      <el-button class="ml-5px" size="small" type="success" @click="openProcessExpressionDialog"
        >选择表达式</el-button
      >
      <!-- 选择弹窗 -->
      <ProcessExpressionDialog ref="processExpressionDialogRef" @select="selectProcessExpression" />
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
import ProcessExpressionDialog from './ProcessExpressionDialog.vue'
import { ProcessExpressionVO } from '@/api/bpm/processExpression'

defineOptions({ name: 'UserTask' })
const props = defineProps({
  id: String,
  type: String
})
const userTaskForm = ref({
  candidateStrategy: undefined, // 分配规则
  candidateParam: [] // 分配选项
})
const bpmnElement = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const deptTreeOptions = ref() // 部门树
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表

const resetTaskForm = () => {
  const businessObject = bpmnElement.value.businessObject
  if (!businessObject) {
    return
  }
  if (businessObject.candidateStrategy != undefined) {
    userTaskForm.value.candidateStrategy = parseInt(businessObject.candidateStrategy) as any
  } else {
    userTaskForm.value.candidateStrategy = undefined
  }
  if (businessObject.candidateParam && businessObject.candidateParam.length > 0) {
    if (userTaskForm.value.candidateStrategy === 60) {
      // 特殊：流程表达式，只有一个 input 输入框
      userTaskForm.value.candidateParam = [businessObject.candidateParam]
    } else {
      userTaskForm.value.candidateParam = businessObject.candidateParam
        .split(',')
        .map((item) => +item)
    }
  } else {
    userTaskForm.value.candidateParam = []
  }
}

/** 更新 candidateStrategy 字段时，需要清空 candidateParam，并触发 bpmn 图更新 */
const changeCandidateStrategy = () => {
  userTaskForm.value.candidateParam = []
  updateElementTask()
}

/** 选中某个 options 时候，更新 bpmn 图  */
const updateElementTask = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    candidateStrategy: userTaskForm.value.candidateStrategy,
    candidateParam: userTaskForm.value.candidateParam.join(',')
  })
}

// 打开监听器弹窗
const processExpressionDialogRef = ref()
const openProcessExpressionDialog = async () => {
  processExpressionDialogRef.value.open()
}
const selectProcessExpression = (expression: ProcessExpressionVO) => {
  userTaskForm.value.candidateParam = [expression.expression]
  updateElementTask()
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
  userGroupOptions.value = await UserGroupApi.getUserGroupSimpleList()
})

onBeforeUnmount(() => {
  bpmnElement.value = null
})
</script>
