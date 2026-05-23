<template>
  <el-form label-width="120px">
    <el-form-item label="规则类型" prop="candidateStrategy">
      <el-select
        v-model="userTaskForm.candidateStrategy"
        clearable
        style="width: 100%"
        @change="changeCandidateStrategy"
      >
        <el-option
          v-for="(dict, index) in CANDIDATE_STRATEGY"
          :key="index"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.candidateStrategy == CandidateStrategy.ROLE"
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
      v-if="
        userTaskForm.candidateStrategy == CandidateStrategy.DEPT_MEMBER ||
        userTaskForm.candidateStrategy == CandidateStrategy.DEPT_LEADER ||
        userTaskForm.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER
      "
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
      v-if="userTaskForm.candidateStrategy == CandidateStrategy.POST"
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
      v-if="userTaskForm.candidateStrategy == CandidateStrategy.USER"
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
      v-if="userTaskForm.candidateStrategy === CandidateStrategy.USER_GROUP"
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
      v-if="userTaskForm.candidateStrategy === CandidateStrategy.FORM_USER"
      label="表单内用户字段"
      prop="formUser"
    >
      <el-select
        v-model="userTaskForm.candidateParam"
        clearable
        style="width: 100%"
        @change="handleFormUserChange"
      >
        <el-option
          v-for="(item, idx) in userFieldOnFormOptions"
          :key="idx"
          :label="item.title"
          :value="item.field"
          :disabled="!item.required"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.candidateStrategy === CandidateStrategy.FORM_DEPT_LEADER"
      label="表单内部门字段"
      prop="formDept"
    >
      <el-select
        v-model="userTaskForm.candidateParam"
        clearable
        style="width: 100%"
        @change="updateElementTask"
      >
        <el-option
          v-for="(item, idx) in deptFieldOnFormOptions"
          :key="idx"
          :label="item.title"
          :value="item.field"
          :disabled="!item.required"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="
        userTaskForm.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER ||
        userTaskForm.candidateStrategy == CandidateStrategy.START_USER_DEPT_LEADER ||
        userTaskForm.candidateStrategy == CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER ||
        userTaskForm.candidateStrategy == CandidateStrategy.FORM_DEPT_LEADER
      "
      :label="deptLevelLabel!"
      prop="deptLevel"
      span="24"
    >
      <el-select v-model="deptLevel" clearable @change="updateElementTask">
        <el-option
          v-for="(item, index) in MULTI_LEVEL_DEPT"
          :key="index"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="userTaskForm.candidateStrategy === CandidateStrategy.EXPRESSION"
      label="流程表达式"
      prop="candidateParam"
    >
      <el-input
        type="textarea"
        v-model="userTaskForm.candidateParam[0]"
        clearable
        style="width: 100%"
        @change="updateElementTask"
      />
      <XButton
        class="!w-1/1 mt-5px"
        type="success"
        preIcon="ep:select"
        title="选择表达式"
        size="small"
        @click="openProcessExpressionDialog"
      />
      <!-- 选择弹窗 -->
      <ProcessExpressionDialog ref="processExpressionDialogRef" @select="selectProcessExpression" />
    </el-form-item>

    <el-form-item label="跳过表达式" prop="skipExpression">
      <el-input
        type="textarea"
        v-model="userTaskForm.skipExpression"
        clearable
        style="width: 100%"
        @change="updateSkipExpression"
      />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import {
  CANDIDATE_STRATEGY,
  CandidateStrategy,
  FieldPermissionType,
  MULTI_LEVEL_DEPT
} from '@/components/SimpleProcessDesignerV2/src/consts'
import { defaultProps, handleTree } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
import ProcessExpressionDialog from './ProcessExpressionDialog.vue'
import { ProcessExpressionVO } from '@/api/bpm/processExpression'
import { useFormFieldsPermission } from '@/components/SimpleProcessDesignerV2/src/node'

defineOptions({ name: 'UserTask' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')
const userTaskForm = ref({
  candidateStrategy: undefined, // 分配规则
  candidateParam: [], // 分配选项
  skipExpression: '' // 跳过表达式
})
const bpmnElement = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const deptTreeOptions = ref() // 部门树
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表

const { formFieldOptions } = useFormFieldsPermission(FieldPermissionType.READ)
// 表单内用户字段选项, 必须是必填和用户选择器
const userFieldOnFormOptions = computed(() => {
  return formFieldOptions.filter((item) => item.type === 'UserSelect')
})
// 表单内部门字段选项, 必须是必填和部门选择器
const deptFieldOnFormOptions = computed(() => {
  return formFieldOptions.filter((item) => item.type === 'DeptSelect')
})

const deptLevel = ref(1)
const deptLevelLabel = computed(() => {
  let label = '部门负责人来源'
  if (userTaskForm.value.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER) {
    label = label + '(指定部门向上)'
  } else if (userTaskForm.value.candidateStrategy == CandidateStrategy.FORM_DEPT_LEADER) {
    label = label + '(表单内部门向上)'
  } else {
    label = label + '(发起人部门向上)'
  }
  return label
})

const otherExtensions = ref()

const resetTaskForm = () => {
  const businessObject = bpmnElement.value.businessObject
  if (!businessObject) {
    return
  }

  const extensionElements =
    businessObject?.extensionElements ??
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })
  userTaskForm.value.candidateStrategy = extensionElements.values?.filter(
    (ex) => ex.$type === `${prefix}:CandidateStrategy`
  )?.[0]?.value
  const candidateParamStr = extensionElements.values?.filter(
    (ex) => ex.$type === `${prefix}:CandidateParam`
  )?.[0]?.value
  if (candidateParamStr && candidateParamStr.length > 0) {
    if (userTaskForm.value.candidateStrategy === CandidateStrategy.EXPRESSION) {
      // 特殊：流程表达式，只有一个 input 输入框
      userTaskForm.value.candidateParam = [candidateParamStr]
    } else if (userTaskForm.value.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER) {
      // 特殊：多级不部门负责人，需要通过'|'分割
      userTaskForm.value.candidateParam = candidateParamStr
        .split('|')[0]
        .split(',')
        .map((item) => {
          // 如果数字超出了最大安全整数范围，则将其作为字符串处理
          let num = Number(item)
          return num > Number.MAX_SAFE_INTEGER || num < -Number.MAX_SAFE_INTEGER ? item : num
        })
      deptLevel.value = +candidateParamStr.split('|')[1]
    } else if (
      userTaskForm.value.candidateStrategy == CandidateStrategy.START_USER_DEPT_LEADER ||
      userTaskForm.value.candidateStrategy == CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER
    ) {
      userTaskForm.value.candidateParam = +candidateParamStr
      deptLevel.value = +candidateParamStr
    } else if (userTaskForm.value.candidateStrategy == CandidateStrategy.FORM_DEPT_LEADER) {
      userTaskForm.value.candidateParam = candidateParamStr.split('|')[0]
      deptLevel.value = +candidateParamStr.split('|')[1]
    } else {
      userTaskForm.value.candidateParam = candidateParamStr.split(',').map((item) => {
        // 如果数字超出了最大安全整数范围，则将其作为字符串处理
        let num = Number(item)
        return num > Number.MAX_SAFE_INTEGER || num < -Number.MAX_SAFE_INTEGER ? item : num
      })
    }
  } else {
    userTaskForm.value.candidateParam = []
  }

  otherExtensions.value =
    extensionElements.values?.filter(
      (ex) => ex.$type !== `${prefix}:CandidateStrategy` && ex.$type !== `${prefix}:CandidateParam`
    ) ?? []

  // 跳过表达式
  if (businessObject.skipExpression != undefined) {
    userTaskForm.value.skipExpression = businessObject.skipExpression
  } else {
    userTaskForm.value.skipExpression = ''
  }

  // 改用通过extensionElements来存储数据
  return
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
        .map((item) => item)
    }
  } else {
    userTaskForm.value.candidateParam = []
  }
}

/** 更新 candidateStrategy 字段时，需要清空 candidateParam，并触发 bpmn 图更新 */
const changeCandidateStrategy = () => {
  userTaskForm.value.candidateParam = []
  deptLevel.value = 1
  // 注释 by 芋艿：这个交互很多用户反馈费解，https://t.zsxq.com/xNmas 所以暂时屏蔽
  // if (userTaskForm.value.candidateStrategy === CandidateStrategy.FORM_USER) {
  //   // 特殊处理表单内用户字段，当只有发起人选项时应选中发起人
  //   if (!userFieldOnFormOptions.value || userFieldOnFormOptions.value.length <= 1) {
  //     userTaskForm.value.candidateStrategy = CandidateStrategy.START_USER
  //   }
  // }
  updateElementTask()
}

/** 选中某个 options 时候，更新 bpmn 图  */
const updateElementTask = () => {
  let candidateParam =
    userTaskForm.value.candidateParam instanceof Array
      ? userTaskForm.value.candidateParam.join(',')
      : userTaskForm.value.candidateParam

  // 特殊处理多级部门情况
  if (
    userTaskForm.value.candidateStrategy == CandidateStrategy.MULTI_LEVEL_DEPT_LEADER ||
    userTaskForm.value.candidateStrategy == CandidateStrategy.FORM_DEPT_LEADER
  ) {
    candidateParam += '|' + deptLevel.value
  }
  // 特殊处理发起人部门负责人、发起人连续部门负责人
  if (
    userTaskForm.value.candidateStrategy == CandidateStrategy.START_USER_DEPT_LEADER ||
    userTaskForm.value.candidateStrategy == CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER
  ) {
    candidateParam = deptLevel.value + ''
  }

  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [
      ...otherExtensions.value,
      bpmnInstances().moddle.create(`${prefix}:CandidateStrategy`, {
        value: userTaskForm.value.candidateStrategy
      }),
      bpmnInstances().moddle.create(`${prefix}:CandidateParam`, {
        value: candidateParam
      })
    ]
  })
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions
  })

  // 改用通过extensionElements来存储数据
  return
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    candidateStrategy: userTaskForm.value.candidateStrategy,
    candidateParam: userTaskForm.value.candidateParam.join(',')
  })
}

const updateSkipExpression = () => {
  if (userTaskForm.value.skipExpression && userTaskForm.value.skipExpression !== '') {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      skipExpression: userTaskForm.value.skipExpression
    })
  } else {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      skipExpression: null
    })
  }
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

const handleFormUserChange = (e) => {
  if (e === 'PROCESS_START_USER_ID') {
    userTaskForm.value.candidateParam = []
    userTaskForm.value.candidateStrategy = CandidateStrategy.START_USER
  }
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
