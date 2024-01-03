<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item v-if="formType === 'create'" label="选择人员" prop="userId">
        <el-select v-model="formData.userId">
          <el-option
            v-for="item in userOptions"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @puhui999：编辑时，level 没带过来 -->
      <el-form-item label="权限级别" prop="level">
        <el-radio-group v-model="formData.level">
          <template
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_PERMISSION_LEVEL)"
            :key="dict.value"
          >
            <el-radio v-if="dict.value != PermissionLevelEnum.OWNER" :label="dict.value">
              {{ dict.label }}
            </el-radio>
          </template>
        </el-radio-group>
      </el-form-item>
      <!-- TODO @puhui999：同时添加至 -->
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as UserApi from '@/api/system/user'
import * as PermissionApi from '@/api/crm/permission'
import { PermissionLevelEnum } from '@/api/crm/permission'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'CrmPermissionForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const formData = ref<PermissionApi.PermissionVO & { ids?: number[] }>({
  userId: undefined, // 用户编号
  bizType: undefined, // CRM 类型
  bizId: undefined, // CRM 类型数据编号
  level: undefined // 权限级别
})
const formRules = reactive({
  userId: [{ required: true, message: '人员不能为空', trigger: 'blur' }],
  level: [{ required: true, message: '权限级别不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: 'create' | 'update', bizType: number, bizId: number, ids?: number[]) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type) + '团队成员'
  formType.value = type
  resetForm(bizType, bizId)
  // 修改时，设置数据
  if (ids) {
    formData.value.ids = ids
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await PermissionApi.createPermission(unref(data))
      message.success(t('common.createSuccess'))
    } else {
      await PermissionApi.updatePermission(unref(data))
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = (bizType: number, bizId: number) => {
  formRef.value?.resetFields()
  formData.value = {
    userId: undefined, // 用户编号
    bizType, // Crm 类型
    bizId, // Crm 类型数据编号
    level: undefined // 权限级别
  }
}
onMounted(async () => {
  // 获得用户列表
  // TODO 芋艿：用户列表的选择组件
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>
