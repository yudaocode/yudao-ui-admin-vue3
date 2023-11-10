<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="字段 1" prop="field1">
        <el-input v-model="formData.field1" placeholder="请输入字段 1" />
      </el-form-item>
      <el-form-item label="字段 2" prop="field2">
        <el-input v-model="formData.field2" placeholder="请输入字段 2" />
      </el-form-item>
      <el-form-item label="字段 3" prop="field3">
        <el-input v-model="formData.field3" placeholder="请输入字段 3" />
      </el-form-item>
    </el-form>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="联系人信息" name="first">
        <DemoStudentContactForm v-model:form-data="formData.demoStudentContactList" />
      </el-tab-pane>
      <el-tab-pane label="地址信息" name="third">地址信息</el-tab-pane>
      <el-tab-pane label="其它信息" name="fourth">其它信息</el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as DemoStudentApi from '@/api/infra/demo02'
import DemoStudentContactForm from './DemoStudentContactForm.vue'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  demoStudentContactList: [
    {
      name: '芋艿',
      mobile: '15601691300'
    }
  ]
})
const formRules = reactive({})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  // resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DemoStudentApi.getDemoStudent(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DemoStudentApi.DemoStudentVO
    if (formType.value === 'create') {
      await DemoStudentApi.createDemoStudent(data)
      message.success(t('common.createSuccess'))
    } else {
      await DemoStudentApi.updateDemoStudent(data)
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
    id: undefined
  }
  formRef.value?.resetFields()
}
</script>
