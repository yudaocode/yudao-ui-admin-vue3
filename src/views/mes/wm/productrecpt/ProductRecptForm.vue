<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="入库单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入入库单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="formType !== 'create'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入入库单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库日期" prop="receiptDate">
            <el-date-picker
              v-model="formData.receiptDate"
              type="date"
              value-format="x"
              placeholder="请选择入库日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <!-- TODO @AI：MdItemSelect 都是 readonly，通过 ProWorkOrderSelect 选择后，设置下； -->
        <el-col :span="8">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示行项目信息（收货物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ProductRecptLineList :recpt-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行上架
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmProductRecptApi, WmProductRecptVO } from '@/api/mes/wm/productrecpt'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import ProductRecptLineList from './ProductRecptLineList.vue'

defineOptions({ name: 'ProductRecptForm' })

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref<string>('create')
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  workOrderId: undefined,
  itemId: undefined,
  receiptDate: undefined,
  remark: undefined
})
const formRules = reactive({
  // TODO @AI：name；必填
  code: [{ required: true, message: '入库单编号不能为空', trigger: 'blur' }],
  receiptDate: [{ required: true, message: '入库日期不能为空', trigger: 'change' }],
  // TODO @AI：workOrderId 可选；
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  // TODO @AI：去掉 itemId 必填；
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }]
})
const formRef = ref()

const isUpdate = computed(() => ['create', 'update'].includes(formType.value))
const isStock = computed(() => formType.value === 'stock')
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value))
const dialogTitle = computed(() => {
  const titles = {
    create: '新增产品入库单',
    update: '编辑产品入库单',
    stock: '执行上架',
    detail: '产品入库单详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成入库单编号 */
const generateCode = () => {
  formData.value.code = 'PR' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductRecptApi.getProductRecpt(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmProductRecptVO
    if (formType.value === 'create') {
      const res = await WmProductRecptApi.createProductRecpt(data)
      message.success('新增成功')
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmProductRecptApi.updateProductRecpt(data)
      message.success('修改成功')
    }
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 执行上架 */
const handleStock = async () => {
  try {
    await message.confirm('确认执行上架？')
    formLoading.value = true
    await WmProductRecptApi.stockProductRecpt(formData.value.id!)
    message.success('上架成功')
    dialogVisible.value = false
    emit('success')
  } catch {
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
    workOrderId: undefined,
    itemId: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
