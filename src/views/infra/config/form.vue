<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form
      ref="ruleFormRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="参数分类" prop="category">
        <el-input v-model="formData.category" placeholder="请输入参数分类" />
      </el-form-item>
      <el-form-item label="参数名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入参数名称" />
      </el-form-item>
      <el-form-item label="参数键名" prop="key">
        <el-input v-model="formData.key" placeholder="请输入参数键名" />
      </el-form-item>
      <el-form-item label="参数键值" prop="value">
        <el-input v-model="formData.value" placeholder="请输入参数键值" />
      </el-form-item>
      <el-form-item label="是否可见" prop="visible">
        <!-- TODO 芋艿：改成组件 -->
        <el-radio-group v-model="formData.visible">
          <el-radio :key="true" :label="true">是</el-radio>
          <el-radio :key="false" :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="colseForm(ruleFormRef)">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as ConfigApi from '@/api/infra/config'
// import type { FormExpose } from '@/components/Form'
import type { FormInstance } from 'element-plus'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
// const { proxy } = getCurrentInstance()

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的数据 Loading 加载
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const submitLoading = ref(false) // 操作按钮的 Loading 加载：避免重复提交
// let formRef = ref() // 表单的 Ref
const formData = reactive({
  id: undefined,
  category: '',
  name: '',
  key: '',
  value: '',
  visible: true,
  remark: ''
})
const formRules = reactive({
  category: [{ required: true, message: '参数分类不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
  key: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  value: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }],
  visible: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }]
})
let ruleFormRef = ref<FormInstance>() // 表单 Ref

const { proxy } = getCurrentInstance() as any

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ConfigApi.getConfig(id)
      // TODO 规范纠结点：因为用 reactive，所以需要使用 Object；可以替换的方案，1）把 reactive 改成 ref；
      Object.assign(formData, data)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  const formRef = proxy.$refs['formRef']
  // 校验表单
  if (!formRef) return
  const valid = await formRef.validate()
  if (!valid) return
  // 提交请求
  submitLoading.value = true
  try {
    const data = formData as ConfigApi.ConfigVO
    if (formType.value === 'create') {
      await ConfigApi.createConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await ConfigApi.updateConfig(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.id = undefined
  formData.category = ''
  formData.name = ''
  formData.key = ''
  formData.value = ''
  formData.visible = true
  formData.remark = ''
  // 重置表单
  console.log(ruleFormRef)
  console.log(ruleFormRef.value)
  // proxy.$refs['ruleFormRef'].resetFields()
  // setTimeout(() => {
  // console.log(ruleFormRef.value, 'formRef.value')
  // formRef.value.resetFields() // TODO 芋艿：为什么拿不到 formRef 呢？ 表单还没加载出来
  // ruleFormRef.value?.resetFields()
  // }, 100)
}
/** 取消添加 */
const colseForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  modelVisible.value = false
}
</script>
