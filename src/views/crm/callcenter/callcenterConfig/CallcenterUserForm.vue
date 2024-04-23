<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="请选择用户" prop="userId">
        <el-select v-model="value" placeholder="请选择">
          <el-option
            v-for="item in list"
            :key="item.value"
            :label="item.label"
            :value="item.value"/>
        </el-select>
      </el-form-item>
      <el-form-item label="外呼用户ID" prop="yunkeCallcenterUserId">
        <el-tag type="warning">{{ formData.yunkeCallcenterUserId==null? "还未绑定":formData.yunkeCallcenterUserId }}</el-tag>
      </el-form-item>
      <el-form-item label="云客手机号" prop="yunkeCallcenterPhone">
        <el-input v-model="formData.yunkeCallcenterPhone" placeholder="请输入云客手机号" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">绑 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { CallcenterUserApi, CallcenterUserVO } from '@/api/crm/callcenter/callcenterConfig'
import { getDictLabel } from '@/utils/dict';

/** 用户与呼叫中心用户绑定关系 表单 */
defineOptions({ name: 'CallcenterUserForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  userId: undefined,
  yunkeCallcenterUserId: undefined,
  yunkeCallcenterPhone: undefined,
  lianlianCallcenterUserId: undefined,
  lianlianCallcenterPhone: undefined
})
const formRules = reactive({
})
const formRef = ref() // 表单 Ref
const list = ref([{value:'0',label:'没有可绑定的用户'}]) //可选择用户清单

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await CallcenterUserApi.getCallcenterUser(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as CallcenterUserVO
    if (formType.value === 'create') {
      await CallcenterUserApi.createCallcenterUser(data)
      message.success(t('common.createSuccess'))
    } else {
      await CallcenterUserApi.updateCallcenterUser(data)
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
const resetForm = () => {
  formData.value = {
    id: undefined,
    userId: undefined,
    yunkeCallcenterUserId: undefined,
    yunkeCallcenterPhone: undefined,
    lianlianCallcenterUserId: undefined,
    lianlianCallcenterPhone: undefined
  }
  formRef.value?.resetFields()
}
</script>