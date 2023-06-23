<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="属性名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as PropertyApi from '@/api/mall/product/property'

defineOptions({ name: 'ProductPropertyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('添加商品属性') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  name: ''
})
const formRules = reactive({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const attributeList = ref([]) // 商品属性列表
const props = defineProps({
  propertyList: {
    type: Array,
    default: () => {}
  }
})

watch(
  () => props.propertyList,
  (data) => {
    if (!data) return
    attributeList.value = data
  },
  {
    deep: true,
    immediate: true
  }
)
/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  resetForm()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as PropertyApi.PropertyVO
    // 检查属性是否已存在，如果有则返回属性和其下属性值
    const res = await PropertyApi.getPropertyListAndValue({ name: data.name })
    if (res.length === 0) {
      const propertyId = await PropertyApi.createProperty(data)
      attributeList.value.push({ id: propertyId, ...formData.value, values: [] })
    } else {
      if (res[0].values === null) {
        res[0].values = []
      }
      attributeList.value.push(res[0]) // 因为只用一个
    }
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    name: ''
  }
  formRef.value?.resetFields()
}
</script>
