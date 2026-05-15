<!-- WMS 商品品牌表单 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="品牌编号" prop="code">
        <el-input v-model="formData.code" maxlength="20" placeholder="请输入品牌编号">
          <template #append>
            <el-button @click="formData.code = generateWmsCode('B')">生成</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="品牌名称" prop="name">
        <el-input v-model="formData.name" maxlength="30" placeholder="请输入品牌名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ItemBrandApi, ItemBrandVO } from '@/api/wms/md/item/brand'
import { generateWmsCode } from '@/views/wms/utils/constants'

/** WMS 商品品牌表单 */
defineOptions({ name: 'WmsItemBrandForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ItemBrandVO>({
  id: undefined,
  code: undefined,
  name: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '品牌编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '品牌名称不能为空', trigger: 'blur' }]
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
      formData.value = await ItemBrandApi.getItemBrand(id)
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
    const data = formData.value as ItemBrandVO
    if (formType.value === 'create') {
      await ItemBrandApi.createItemBrand(data)
      message.success(t('common.createSuccess'))
    } else {
      await ItemBrandApi.updateItemBrand(data)
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
    code: undefined,
    name: undefined
  }
  formRef.value?.resetFields()
}
</script>
