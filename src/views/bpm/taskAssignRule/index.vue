<template>
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="任务名" align="center" prop="taskDefinitionName" />
      <el-table-column label="任务标识" align="center" prop="taskDefinitionKey" />
      <el-table-column label="规则类型" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_TASK_ASSIGN_RULE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="规则范围" align="center" prop="options">
        <template #default="scope">
          <el-tag class="mr-5px" :key="option" v-for="option in scope.row.options">
            {{ getAssignRuleOptionName(scope.row.type, option) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="queryParams.modelId" label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm(scope.row)"
            v-hasPermi="['bpm:task-assign-rule:update']"
          >
            修改
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
  <!-- 添加/修改弹窗 -->
  <TaskAssignRuleForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts" name="BpmTaskAssignRule">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as TaskAssignRuleApi from '@/api/bpm/taskAssignRule'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
import TaskAssignRuleForm from './TaskAssignRuleForm.vue'
const { query } = useRoute() // 查询参数

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const queryParams = reactive({
  modelId: query.modelId, // 流程模型的编号。如果 modelId 非空，则用于流程模型的查看与配置
  processDefinitionId: query.processDefinitionId // 流程定义的编号。如果 processDefinitionId 非空，则用于流程定义的查看，不支持配置
})
const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const deptOptions = ref<DeptApi.DeptVO[]>([]) // 部门列表
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
const taskAssignScriptDictDatas = getIntDictOptions(DICT_TYPE.BPM_TASK_ASSIGN_SCRIPT)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await TaskAssignRuleApi.getTaskAssignRuleList(queryParams)
  } finally {
    loading.value = false
  }
}

/** 翻译规则范围 */
// TODO 芋艿：各种 ts 报错
const getAssignRuleOptionName = (type, option) => {
  if (type === 10) {
    for (const roleOption of roleOptions.value) {
      if (roleOption.id === option) {
        return roleOption.name
      }
    }
  } else if (type === 20 || type === 21) {
    for (const deptOption of deptOptions.value) {
      if (deptOption.id === option) {
        return deptOption.name
      }
    }
  } else if (type === 22) {
    for (const postOption of postOptions.value) {
      if (postOption.id === option) {
        return postOption.name
      }
    }
  } else if (type === 30 || type === 31 || type === 32) {
    for (const userOption of userOptions.value) {
      if (userOption.id === option) {
        return userOption.nickname
      }
    }
  } else if (type === 40) {
    for (const userGroupOption of userGroupOptions.value) {
      if (userGroupOption.id === option) {
        return userGroupOption.name
      }
    }
  } else if (type === 50) {
    option = option + '' // 转换成 string
    for (const dictData of taskAssignScriptDictDatas) {
      if (dictData.value === option) {
        return dictData.label
      }
    }
  }
  return '未知(' + option + ')'
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (row: TaskAssignRuleApi.TaskAssignVO) => {
  formRef.value.open(queryParams.modelId, row)
}

/** 初始化 */
onMounted(async () => {
  await getList()
  // 获得角色列表
  roleOptions.value = await RoleApi.getSimpleRoleList()
  // 获得部门列表
  deptOptions.value = await DeptApi.getSimpleDeptList()
  // 获得岗位列表
  postOptions.value = await PostApi.getSimplePostList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 获得用户组列表
  userGroupOptions.value = await UserGroupApi.getSimpleUserGroupList()
})
</script>
