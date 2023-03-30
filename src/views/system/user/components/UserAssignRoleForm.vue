<template>
  <Dialog
    title="分配角色"
    :modelValue="showDialog"
    width="500px"
    append-to-body
    @close="closeDialog"
  >
    <el-form :model="formData" label-width="80px" ref="formRef">
      <el-form-item label="用户名称">
        <el-input v-model="formData.username" :disabled="true" />
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input v-model="formData.nickname" :disabled="true" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="formData.roleIds" multiple placeholder="请选择角色">
          <el-option
            v-for="item in roleOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submit">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import {
  assignUserRoleApi,
  listUserRolesApi,
  PermissionAssignUserRoleReqVO
} from '@/api/system/permission'
import { UserVO } from '@/api/system/user'
import * as RoleApi from '@/api/system/role'

const emits = defineEmits(['success'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// 表单初始化参数
const initParams = {
  nickname: '',
  id: 0,
  username: '',
  roleIds: [] as number[]
}
const formData = ref<Recordable>({ ...initParams })

/* 弹框按钮操作 */
// 点击取消
const cancel = () => {
  closeDialog()
}
// 关闭弹窗
const closeDialog = () => {
  showDialog.value = false
}
// 提交
const submit = async () => {
  const data = ref<PermissionAssignUserRoleReqVO>({
    userId: formData.value.id,
    roleIds: formData.value.roleIds
  })
  try {
    await assignUserRoleApi(data.value)
    message.success(t('common.updateSuccess'))
    emits('success', true)
    closeDialog()
  } catch (error) {
    console.error(error)
  }
}

const roleOptions = ref()
const userRole = reactive(initParams)
const showDialog = ref(false)
const formRef = ref()
const openForm = async (row: UserVO) => {
  formRef.value?.resetFields()
  userRole.id = row.id
  userRole.username = row.username
  userRole.nickname = row.nickname

  // 获得角色列表
  const roleOpt = await RoleApi.getSimpleRoleList()
  roleOptions.value = [...roleOpt]

  // 获得角色拥有的菜单集合
  const roles = await listUserRolesApi(row.id)
  userRole.roleIds = roles
  formData.value = { ...userRole }

  showDialog.value = true
}
defineExpose({
  openForm
})
</script>
