<!-- WMS 商品分类表单 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="上级分类" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="categoryTree"
          :props="defaultProps"
          check-strictly
          default-expand-all
          placeholder="请选择上级分类"
        />
      </el-form-item>
      <el-form-item label="分类编号" prop="code">
        <el-input v-model="formData.code" maxlength="20" placeholder="请输入分类编号">
          <template #append>
            <el-button @click="formData.code = generateWmsCode('C')">生成</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          class="!w-1/1"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" clearable placeholder="请选择状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import { CommonStatusEnum } from '@/utils/constants'
import { FormRules } from 'element-plus'
import { ItemCategoryApi, ItemCategoryVO } from '@/api/wms/md/item/category'
import { generateWmsCode } from '@/views/wms/utils/constants'

/** WMS 商品分类表单 */
defineOptions({ name: 'WmsItemCategoryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ItemCategoryVO>({
  id: undefined,
  parentId: undefined,
  code: undefined,
  name: undefined,
  sort: 0,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive<FormRules>({
  parentId: [{ required: true, message: '上级分类不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '分类编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const categoryTree = ref() // 树形结构

/** 打开弹窗 */
const open = async (type: string, id?: number, parentId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm(parentId)
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ItemCategoryApi.getItemCategory(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得分类树
  await getTree()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 获得分类树 */
const getTree = async () => {
  categoryTree.value = []
  const data = await ItemCategoryApi.getItemCategorySimpleList()
  let category: Tree = { id: 0, name: '顶级分类', children: [] }
  category.children = handleTree(data, 'id', 'parentId')
  categoryTree.value.push(category)
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) {
    return
  }
  const valid = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ItemCategoryVO
    if (formType.value === 'create') {
      await ItemCategoryApi.createItemCategory(data)
      message.success(t('common.createSuccess'))
    } else {
      await ItemCategoryApi.updateItemCategory(data)
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
const resetForm = (parentId?: number) => {
  formData.value = {
    id: undefined,
    parentId,
    code: undefined,
    name: undefined,
    sort: 0,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
