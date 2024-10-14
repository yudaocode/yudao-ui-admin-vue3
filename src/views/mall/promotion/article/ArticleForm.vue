<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="70%">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="文章标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入文章标题" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文章分类" prop="categoryId">
            <el-select v-model="formData.categoryId" placeholder="请选择">
              <el-option
                v-for="item in categoryList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文章作者" prop="author">
            <el-input v-model="formData.author" placeholder="请输入文章作者" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文章简介" prop="introduction">
            <el-input v-model="formData.introduction" placeholder="请输入文章简介" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="文章封面" prop="picUrl">
            <UploadImg v-model="formData.picUrl" height="80px" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" clearable controls-position="right" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否热门" prop="recommendHot">
            <el-radio-group v-model="formData.recommendHot">
              <el-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否轮播图" prop="recommendBanner">
            <el-radio-group v-model="formData.recommendBanner">
              <el-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="商品关联" prop="spuId">
            <el-tag v-if="formData.spuId" class="mr-10px">
              {{ spuList.find((item) => item.id === formData.spuId)?.name }}
            </el-tag>
            <el-button @click="spuSelectRef?.open()">选择商品</el-button>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="文章内容">
            <Editor v-model="formData.content" height="150px" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <SpuSelect ref="spuSelectRef" @confirm="selectSpu" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import * as ArticleApi from '@/api/mall/promotion/article'
import * as ArticleCategoryApi from '@/api/mall/promotion/articleCategory'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { SpuSelect } from '@/views/mall/promotion/components'

defineOptions({ name: 'PromotionArticleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  categoryId: undefined,
  title: undefined,
  author: undefined,
  picUrl: undefined,
  introduction: undefined,
  sort: 0,
  status: 0,
  spuId: 0,
  recommendHot: false,
  recommendBanner: false,
  content: undefined
})
const formRules = reactive({
  categoryId: [{ required: true, message: '分类id不能为空', trigger: 'blur' }],
  title: [{ required: true, message: '文章标题不能为空', trigger: 'blur' }],
  picUrl: [{ required: true, message: '文章封面图片地址不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  spuId: [{ required: true, message: '商品关联id不能为空', trigger: 'blur' }],
  recommendHot: [{ required: true, message: '是否热门(小程序)不能为空', trigger: 'blur' }],
  recommendBanner: [{ required: true, message: '是否轮播图(小程序)不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '文章内容不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const spuSelectRef = ref() // 商品和属性选择 Ref
const selectSpu = (spuId: number) => {
  formData.value.spuId = spuId
}
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
      formData.value = await ArticleApi.getArticle(id)
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
    const data = formData.value as unknown as ArticleApi.ArticleVO
    if (formType.value === 'create') {
      await ArticleApi.createArticle(data)
      message.success(t('common.createSuccess'))
    } else {
      await ArticleApi.updateArticle(data)
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
    categoryId: undefined,
    title: undefined,
    author: undefined,
    picUrl: undefined,
    introduction: undefined,
    sort: 0,
    status: 0,
    spuId: 0,
    recommendHot: false,
    recommendBanner: false,
    content: undefined
  }
  formRef.value?.resetFields()
}

const categoryList = ref<ArticleCategoryApi.ArticleCategoryVO[]>([])
const spuList = ref<ProductSpuApi.Spu[]>([])
onMounted(async () => {
  categoryList.value =
    (await ArticleCategoryApi.getSimpleArticleCategoryList()) as ArticleCategoryApi.ArticleCategoryVO[]
  spuList.value = (await ProductSpuApi.getSpuSimpleList()) as ProductSpuApi.Spu[]
})
</script>
