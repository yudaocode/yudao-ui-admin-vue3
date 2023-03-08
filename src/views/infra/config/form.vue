<template>
  <!-- TODO 芋艿：Dialog 貌似高度不太对劲 -->
  <Dialog :title="modelTitle" v-model="modelVisible" :loading="modelLoading">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
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
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as ConfigApi from '@/api/infra/config'
// import type { FormExpose } from '@/components/Form'
import * as PostApi from '@/api/system/post'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
// const { proxy } = getCurrentInstance()

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const modelLoading = ref(false) // 弹窗的 Loading 加载
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formLoading = ref(false) // 操作按钮的 Loading 加载
let formRef = ref() // 表单的 Ref
const formData = reactive({
  id: undefined,
  category: undefined,
  name: undefined,
  key: undefined,
  value: undefined,
  visible: true,
  remark: undefined
})
const formRules = reactive({
  category: [{ required: true, message: '参数分类不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
  key: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  value: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }],
  visible: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }]
})
// const formRef = ref<FormExpose>() // 表单 Ref

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelLoading.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  // 设置数据
  resetForm()
  if (id) {
    const data = await ConfigApi.getConfig(id)
    Object.assign(formData, data)
  }
  modelLoading.value = false
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  const elForm = unref(formRef)?.getElFormRef()
  if (!elForm) return
  const valid = await elForm.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = unref(formRef)?.formModel as PostApi.PostVO
    if (formType.value === 'create') {
      await PostApi.createPostApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await PostApi.updatePostApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.id = undefined
  formData.category = undefined
  formData.name = undefined
  formData.key = undefined
  formData.value = undefined
  formData.visible = true
  formData.remark = undefined
  // proxy.$refs['formRef'].resetFields()
  // formRef.value.resetFields() // TODO 芋艿：为什么拿不到
}
</script>
