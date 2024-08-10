<template>
  <SimpleProcessDesigner :model-id="modelId" />
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'
import { getModel } from '@/api/bpm/model'
import { getForm, FormVO } from '@/api/bpm/form'
import { handleTree } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
defineOptions({
  name: 'SimpleWorkflowDesignEditor'
})
const { query } = useRoute() // 路由的查询
const modelId: string | undefined = query.modelId as string
const formFields = ref<string[]>([])
const formType = ref(20)
const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const deptOptions = ref<DeptApi.DeptVO[]>([]) // 部门列表
const deptTreeOptions = ref()
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
provide('formFields', formFields)
provide('formType', formType)
provide('roleList', roleOptions)
provide('postList', postOptions)
provide('userList', userOptions)
provide('deptList', deptOptions)
provide('userGroupList', userGroupOptions)
provide('deptTree', deptTreeOptions)
onMounted(async () => {
  const bpmnModel = await getModel(modelId)
  if (bpmnModel) {
    formType.value = bpmnModel.formType
    if (formType.value === 10) {
      const bpmnForm = (await getForm(bpmnModel.formId)) as unknown as FormVO
      formFields.value = bpmnForm?.fields
    }
  }
  // 获得角色列表
  roleOptions.value = await RoleApi.getSimpleRoleList()
  // 获得岗位列表
  postOptions.value = await PostApi.getSimplePostList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 获得部门列表
  deptOptions.value = await DeptApi.getSimpleDeptList()

  deptTreeOptions.value = handleTree(deptOptions.value as DeptApi.DeptVO[], 'id')

  // 用户组列表
  userGroupOptions.value = await UserGroupApi.getUserGroupSimpleList()
})
</script>
<style lang="scss" scoped></style>
