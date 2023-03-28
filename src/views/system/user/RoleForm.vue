<template>
  <el-dialog title="分配角色" :modelValue="show" width="500px" append-to-body @close="closeDialog">
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
  </el-dialog>
</template>

<script setup lang="ts">
// TODO el-dialog 用 Dialog 组件
import { assignUserRoleApi, PermissionAssignUserRoleReqVO } from '@/api/system/permission'

interface Props {
  show: boolean
  roleOptions: any[]
  formInitValue?: Recordable & Partial<typeof initParams>
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  roleOptions: () => [],
  formInitValue: () => ({})
})
const emits = defineEmits(['update:show', 'success'])

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
watch(
  () => props.formInitValue,
  (val) => {
    formData.value = { ...val }
  },
  { deep: true }
)
/* 弹框按钮操作 */
// 点击取消
const cancel = () => {
  closeDialog()
}
// 关闭弹窗
const closeDialog = () => {
  emits('update:show', false)
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
</script>
