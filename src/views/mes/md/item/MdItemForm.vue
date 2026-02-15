<!-- MES 物料产品的新增/修改 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <!-- TODO @AI：一行 3 个？ -->
      <el-row :gutter="20">
        <el-col :span="12">
          <!-- TODO @AI：有个生成按钮，类似 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/iot/product/product/ProductForm.vue -->
          <!-- TODO @芋艿：先做个假的，ai；把交互做通；后续会有个后端接口 -->
          <el-form-item label="物料编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入物料编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入物料名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规格型号" prop="specification">
            <el-input v-model="formData.specification" placeholder="请输入规格型号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位" prop="unitOfMeasure">
            <el-input v-model="formData.unitOfMeasure" placeholder="请输入单位编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料分类" prop="itemTypeId">
            <el-tree-select
              v-model="formData.itemTypeId"
              :data="itemTypeList"
              :props="defaultProps"
              check-strictly
              default-expand-all
              placeholder="请选择物料分类"
              class="w-1/1"
            />
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
          <el-form-item label="高值物料" prop="highValue">
            <el-switch v-model="formData.highValue" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批次管理" prop="batchFlag">
            <el-switch v-model="formData.batchFlag" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="安全库存" prop="safeStockFlag">
            <el-switch v-model="formData.safeStockFlag" />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="formData.safeStockFlag">
          <el-form-item label="最低库存量" prop="minStock">
            <el-input-number
              v-model="formData.minStock"
              placeholder="请输入最低库存量"
              :min="0"
              :precision="4"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="formData.safeStockFlag">
          <el-form-item label="最高库存量" prop="maxStock">
            <el-input-number
              v-model="formData.maxStock"
              placeholder="请输入最高库存量"
              :min="0"
              :precision="4"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- TODO @AI：底部的 tab 有 BOM组成、批次属性、替代品、SIP、SOP；做法类似：/Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/member/user/detail 有很多 tab；只有修改时，才展示 -->
    <!-- TODO @AI：是不是要有个组件，BarcodeImg 二维码查看； -->
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import { MdItemTypeApi, MdItemTypeVO } from '@/api/mes/md/item/type'
import { CommonStatusEnum } from '@/utils/constants'
import { defaultProps, handleTree } from '@/utils/tree'

/** MES 物料产品 表单 */
defineOptions({ name: 'MdItemForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  specification: undefined,
  unitOfMeasure: undefined, // TODO @芋艿：等等关联的组件搞完，我们补充下！另外，这个字段貌似改成 unitMeasureId 更好？
  itemTypeId: undefined,
  status: CommonStatusEnum.ENABLE,
  safeStockFlag: false,
  minStock: 0,
  maxStock: 0,
  highValue: false,
  batchFlag: true,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }],
  unitOfMeasure: [{ required: true, message: '单位编码不能为空', trigger: 'blur' }],
  itemTypeId: [{ required: true, message: '物料分类不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const itemTypeList = ref<MdItemTypeVO[]>([]) // 物料分类列表

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
      formData.value = await MdItemApi.getItem(id)
    } finally {
      formLoading.value = false
    }
  }
  // 物料分类
  const categoryData = await MdItemTypeApi.getItemTypeSimpleList()
  itemTypeList.value = handleTree(categoryData, 'id', 'parentId')
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
    const data = formData.value as unknown as MdItemVO
    if (formType.value === 'create') {
      await MdItemApi.createItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdItemApi.updateItem(data)
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
    name: undefined,
    specification: undefined,
    unitOfMeasure: undefined,
    itemTypeId: undefined,
    status: CommonStatusEnum.ENABLE,
    safeStockFlag: false,
    minStock: 0,
    maxStock: 0,
    highValue: false,
    batchFlag: true,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
