<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模板名称" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" type="textarea" />
      </el-form-item>
      <el-form-item label="预览图" prop="previewImageUrls">
        <UploadImgs v-model="formData.previewImageUrls" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as DiyTemplateApi from '@/api/mall/promotion/diy/template'

/** 装修模板表单 */
defineOptions({ name: 'DiyTemplateForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  remark: undefined,
  previewImageUrls: []
})
const formRules = reactive({
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      const diyTemplate = await DiyTemplateApi.getDiyTemplate(id)
      // 处理预览图
      if (diyTemplate?.previewImageUrls?.length > 0) {
        diyTemplate.previewImageUrls = diyTemplate.previewImageUrls.map((url: string) => {
          return { url }
        })
      }
      formData.value = diyTemplate
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
    // 处理预览图
    const previewImageUrls = formData.value.previewImageUrls.map((item) => {
      return item['url'] ? item['url'] : item
    })
    const data = { ...formData.value, previewImageUrls } as unknown as DiyTemplateApi.DiyTemplateVO
    if (formType.value === 'create') {
      await DiyTemplateApi.createDiyTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await DiyTemplateApi.updateDiyTemplate(data)
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
    name: undefined,
    remark: undefined,
    previewImageUrls: []
  }
  formRef.value?.resetFields()
}
</script>
