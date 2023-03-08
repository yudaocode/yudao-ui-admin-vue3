<template>
  <XModal :title="modelTitle" :loading="modelLoading" v-model="modelVisible">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="参数分类" prop="category">
        <el-input v-model="form.category" placeholder="请输入参数分类" />
      </el-form-item>
      <el-form-item label="参数名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入参数名称" />
      </el-form-item>
      <el-form-item label="参数键名" prop="key">
        <el-input v-model="form.key" placeholder="请输入参数键名" />
      </el-form-item>
      <el-form-item label="参数键值" prop="value">
        <el-input v-model="form.value" placeholder="请输入参数键值" />
      </el-form-item>
      <el-form-item label="是否可见" prop="visible">
        <!-- TODO 芋艿：改成组件 -->
        <el-radio-group v-model="form.visible">
          <el-radio :key="true" :label="true">是</el-radio>
          <el-radio :key="false" :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="modelLoading = false">取 消</el-button>
      </div>
    </template>
  </XModal>
</template>
<script setup lang="ts">
// import type { FormExpose } from '@/components/Form'
import * as PostApi from '@/api/system/post'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const modelLoading = ref(false) // 弹窗的 Loading 加载
const actionType = ref('') // 操作类型：create - 新增；update - 修改
const actionLoading = ref(false) // 操作按钮的 Loading 加载
const formRef = ref() // 表单的 Ref
const form = reactive({
  id: undefined,
  category: undefined,
  name: undefined,
  key: undefined,
  value: undefined,
  visible: true,
  remark: undefined
})
const rules = reactive({
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
  actionType.value = type
  // 设置数据
  resetForm()
  if (id) {
    // const res = await PostApi.getPostApi(id)
    // if (type === 'update') {
    //   unref(formRef)?.setValues(res)
    // } else if (type === 'detail') {
    //   detailData.value = res
    // }
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
  actionLoading.value = true
  try {
    const data = unref(formRef)?.formModel as PostApi.PostVO
    if (actionType.value === 'create') {
      await PostApi.createPostApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await PostApi.updatePostApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    emit('success')
  } finally {
    actionLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  form.id = undefined
  form.category = undefined
  form.name = undefined
  form.key = undefined
  form.value = undefined
  form.visible = true
  form.remark = undefined
  formRef.value.resetFields()
}
</script>
