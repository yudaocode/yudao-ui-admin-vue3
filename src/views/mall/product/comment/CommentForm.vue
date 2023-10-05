<template>
  <Dialog title="添加虚拟评论" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="商品" prop="spuId">
        <div @click="handleSelectSpu" class="h-60px w-60px">
          <div v-if="spuData && spuData.picUrl">
            <el-image :src="spuData.picUrl" />
          </div>
          <div v-else class="select-box">
            <Icon icon="ep:plus" />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="商品规格" prop="skuId" v-if="formData.spuId">
        <div @click="handleSelectSku" class="h-60px w-60px">
          <div v-if="skuData && skuData.picUrl">
            <el-image :src="skuData.picUrl" />
          </div>
          <div v-else class="select-box">
            <Icon icon="ep:plus" />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="用户头像" prop="userAvatar">
        <UploadImg v-model="formData.userAvatar" height="60px" width="60px" />
      </el-form-item>
      <el-form-item label="用户名称" prop="userNickname">
        <el-input v-model="formData.userNickname" placeholder="请输入用户名称" />
      </el-form-item>
      <el-form-item label="评论内容" prop="content">
        <el-input type="textarea" v-model="formData.content" />
      </el-form-item>
      <el-form-item label="描述星级" prop="descriptionScores">
        <el-rate v-model="formData.descriptionScores" />
      </el-form-item>
      <el-form-item label="服务星级" prop="benefitScores">
        <el-rate v-model="formData.benefitScores" />
      </el-form-item>
      <el-form-item label="评论图片" prop="picUrls">
        <UploadImgs v-model="formData.picUrls" :limit="9" height="60px" width="60px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <SpuTableSelect ref="spuTableSelectRef" @change="handleSpuChange" />
  <SkuTableSelect ref="skuTableSelectRef" @change="handleSkuChange" :spu-id="spuData.id" />
</template>
<script setup lang="ts">
import * as CommentApi from '@/api/mall/product/comment'
import SpuTableSelect from '@/views/mall/product/spu/components/SpuTableSelect.vue'
import * as ProductSpuApi from '@/api/mall/product/spu'
import SkuTableSelect from '@/views/mall/product/spu/components/SkuTableSelect.vue'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  userId: undefined,
  userNickname: undefined,
  userAvatar: undefined,
  spuId: undefined,
  spuName: undefined,
  skuId: undefined,
  descriptionScores: 5,
  benefitScores: 5,
  content: undefined,
  picUrls: []
})
const formRules = reactive({
  spuId: [{ required: true, message: '商品不能为空', trigger: 'blur' }],
  skuId: [{ required: true, message: '规格不能为空', trigger: 'blur' }],
  userAvatar: [{ required: true, message: '用户头像不能为空', trigger: 'blur' }],
  userNickname: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '评论内容不能为空', trigger: 'blur' }],
  descriptionScores: [{ required: true, message: '描述星级不能为空', trigger: 'blur' }],
  benefitScores: [{ required: true, message: '服务星级不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const spuData = ref<ProductSpuApi.Spu>({})
const skuData = ref({
  id: -1,
  name: '',
  picUrl: ''
})

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
      formData.value = await CommentApi.getComment(id)
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
    //处理评论图片
    const picUrls = formData.value.picUrls.map((item) => {
      return item?.url ? item.url : item
    })
    const data = { ...formData.value, picUrls }
    if (formType.value === 'create') {
      await CommentApi.createComment(data)
      message.success(t('common.createSuccess'))
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
    userNickname: undefined,
    userAvatar: undefined,
    spuId: undefined,
    spuName: undefined,
    skuId: undefined,
    descriptionScores: 5,
    benefitScores: 5,
    content: undefined,
    picUrls: []
  }
  formRef.value?.resetFields()
}

/** SPU 表格选择 */
const spuTableSelectRef = ref()
const handleSelectSpu = () => {
  spuTableSelectRef.value.open()
}
const handleSpuChange = (spu: ProductSpuApi.Spu) => {
  spuData.value = spu
  formData.value.spuId = spu.id
}

/** SKU 表格选择 */
const skuTableSelectRef = ref()
const handleSelectSku = () => {
  skuTableSelectRef.value.open()
}
const handleSkuChange = (sku: ProductSpuApi.Sku) => {
  skuData.value = sku
  formData.value.skuId = sku.id
}
</script>
<style>
.select-box {
  display: flex;
  width: 100%;
  height: 100%;
  border: 1px dashed var(--el-border-color-darker);
  border-radius: 8px;
  align-items: center;
  justify-content: center;
}
</style>
