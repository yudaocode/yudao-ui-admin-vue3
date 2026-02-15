<!-- MES 物料产品分类表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="上级分类" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="itemTypeTree"
          :props="defaultProps"
          check-strictly
          default-expand-all
          placeholder="请选择上级分类"
          class="w-1/1"
        />
      </el-form-item>
      <el-form-item label="分类编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入分类编码" />
      </el-form-item>
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="物料/产品标识" prop="itemOrProduct">
        <el-radio-group v-model="formData.itemOrProduct">
          <el-radio :value="MesItemOrProductEnum.ITEM.value">物料</el-radio>
          <el-radio :value="MesItemOrProductEnum.PRODUCT.value">产品</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :precision="0" class="!w-1/1" />
      </el-form-item>
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
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdItemTypeApi, MdItemTypeVO } from '@/api/mes/md/item/type'
import { defaultProps, handleTree } from '@/utils/tree'
import { CommonStatusEnum } from '@/utils/constants'
import { MesItemOrProductEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MdItemTypeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as unknown as number,
  parentId: undefined as unknown as number,
  code: undefined as unknown as string,
  name: undefined as unknown as string,
  itemOrProduct: MesItemOrProductEnum.ITEM.value as string,
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  remark: undefined as unknown as string
})
const formRules = reactive({
  parentId: [{ required: true, message: '上级分类不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '分类编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  itemOrProduct: [{ required: true, message: '物料/产品标识不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const itemTypeTree = ref() // 树形结构

/** 打开弹窗 */
const open = async (type: string, id?: number, parentId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MdItemTypeApi.getItemType(id)
    } finally {
      formLoading.value = false
    }
  }
  // 新增子分类时，设置父分类
  if (parentId) {
    formData.value.parentId = parentId
  }
  await getItemTypeTree()
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
    const data = formData.value as unknown as MdItemTypeVO
    if (formType.value === 'create') {
      await MdItemTypeApi.createItemType(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdItemTypeApi.updateItemType(data)
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
    parentId: undefined,
    code: undefined,
    name: undefined,
    itemOrProduct: MesItemOrProductEnum.ITEM.value,
    sort: 0,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 获得物料产品分类树 */
const getItemTypeTree = async () => {
  itemTypeTree.value = []
  const data = await MdItemTypeApi.getItemTypeList()
  const root: Tree = { id: 0, name: '顶级分类', children: [] }
  root.children = handleTree(data)
  itemTypeTree.value.push(root)
}
</script>
