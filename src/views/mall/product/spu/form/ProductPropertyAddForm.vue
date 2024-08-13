<!-- 商品发布 - 库存价格 - 添加属性 -->
<template>
  <Dialog v-model="dialogVisible" title="添加商品属性">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      @keydown.enter.prevent="submitForm"
    >
      <el-form-item label="属性名称" prop="name">
        <el-select
          v-model="formData.name"
          filterable
          allow-create
          default-first-option
          :reserve-keyword="false"
          placeholder="请选择属性名称。如果不存在，可手动输入选择"
          class="!w-360px"
        >
          <el-option
            v-for="item in attributeOptions"
            :key="item.id"
            :label="item.name"
            :value="item.name"
          />
        </el-select>
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

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  name: ''
})
const formRules = reactive({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const attributeList = ref([]) // 商品属性列表
const attributeOptions = ref([] as PropertyApi.PropertyVO[]) // 商品属性名称下拉框
const props = defineProps({
  propertyList: {
    type: Array,
    default: () => {}
  }
})

watch(
  () => props.propertyList, // 解决 props 无法直接修改父组件的问题
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
  // 加载列表
  await getAttributeOptions()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 情况一：如果是已存在的属性，直接结束，不提交表单新增
  for (const option of attributeOptions.value) {
    if (option.name === formData.value.name) {
      // 添加到属性列表
      attributeList.value.push({
        id: option.id,
        ...formData.value,
        values: []
      })
      // 触发属性列表的加载
      emit('success', option.id, option.id)
      // 关闭弹窗
      dialogVisible.value = false
      return
    }
  }

  // 情况二：如果是不存在的属性，则需要执行新增
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as PropertyApi.PropertyVO
    const propertyId = await PropertyApi.createProperty(data)
    // 添加到属性列表
    attributeList.value.push({
      id: propertyId,
      ...formData.value,
      values: []
    })
    // 关闭弹窗
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

/** 获取商品属性下拉选项 */
const getAttributeOptions = async () => {
  formLoading.value = true
  try {
    attributeOptions.value = await PropertyApi.getPropertySimpleList()
  } finally {
    formLoading.value = false
  }
}
</script>
