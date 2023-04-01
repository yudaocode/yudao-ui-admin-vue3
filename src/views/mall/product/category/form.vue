<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="上级分类" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="parentCategoryOptions"
          check-strictly
          :render-after-expand="false"
          placeholder="上级分类"
          :props="{ label: 'name', value: 'id' }"
          default-expand-all
        />
      </el-form-item>
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类图片" prop="picUrl">
        <UploadImg v-model="formData.picUrl" :limit="1" :is-show-tip="false" />
        <div v-if="formData.parentId === 0" style="font-size: 10px">推荐 200x100 图片分辨率</div>
        <div v-else style="font-size: 10px">推荐 100x100 图片分辨率</div>
      </el-form-item>
      <el-form-item label="分类排序" prop="sort">
        <el-input-number v-model="formData.sort" controls-position="right" :min="0" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="分类描述">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入分类描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import * as ProductCategoryApi from '@/api/mall/product/category'
import { handleTree } from '@/utils/tree'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改

const defaultFormData: ProductCategoryApi.CategoryVO = {
  id: undefined,
  name: '',
  picUrl: '',
  status: 0,
  description: ''
}
const formData = ref({ ...defaultFormData })
const formRules = reactive({
  parentId: [{ required: true, message: '请选择上级分类', trigger: 'blur' }],
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  picUrl: [{ required: true, message: '分类图片不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '分类排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '开启状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

const list = ref([])
const parentCategoryOptions = ref<any[]>([])

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  getList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProductCategoryApi.getCategory(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

// 获取上级分类选项
const getList = async () => {
  try {
    const data = await ProductCategoryApi.getCategoryList({})
    list.value = data
    const tree = handleTree(data, 'id', 'parentId')
    const menu = { id: 0, name: '顶级分类', children: tree }
    parentCategoryOptions.value = [menu]
  } finally {
  }
}

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
    const data = formData.value as ProductCategoryApi.CategoryVO
    if (formType.value === 'create') {
      await ProductCategoryApi.createCategory(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductCategoryApi.updateCategory(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = { ...defaultFormData }
  formRef.value?.resetFields()
}
</script>
