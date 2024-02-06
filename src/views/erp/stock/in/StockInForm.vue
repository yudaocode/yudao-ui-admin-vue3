<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1080">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <!-- TODO 芋艿：待接入 -->
        <el-col :span="8">
          <el-form-item label="入库单号" prop="no">
            <el-input v-model="formData.no" placeholder="请输入入库单号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库时间" prop="inTime">
            <el-date-picker
              v-model="formData.inTime"
              type="date"
              value-format="x"
              placeholder="选择入库时间"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <!-- TODO 芋艿：待接入 -->
        <el-col :span="8">
          <el-form-item label="供应商" prop="supplierId">
            <el-input v-model="formData.supplierId" placeholder="请输入供应商" />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="formData.remark"
              :rows="1"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="附件" prop="fileUrl">
            <UploadFile :is-show-tip="false" v-model="formData.fileUrl" :limit="1" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 子表的表单 -->
    <ContentWrap>
      <el-tabs v-model="subTabsName" class="-mt-15px -mb-10px">
        <el-tab-pane label="入库产品清单" name="stockInItem">
          <StockInItemForm ref="stockInItemFormRef" :items="formData.items" />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { StockInApi, StockInVO } from '@/api/erp/stock/in'
import StockInItemForm from './components/StockInItemForm.vue'

/** ERP 其它入库单 表单 */
defineOptions({ name: 'StockInForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  inTime: undefined,
  remark: undefined,
  fileUrl: '',
  items: []
})
const formRules = reactive({
  no: [{ required: true, message: '入库单号不能为空', trigger: 'blur' }],
  inTime: [{ required: true, message: '入库时间不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 子表的表单 */
const subTabsName = ref('stockInItem')
const stockInItemFormRef = ref()

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
      formData.value = await StockInApi.getStockIn(id)
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
  await stockInItemFormRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as StockInVO
    if (formType.value === 'create') {
      await StockInApi.createStockIn(data)
      message.success(t('common.createSuccess'))
    } else {
      await StockInApi.updateStockIn(data)
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
    no: undefined,
    supplierId: undefined,
    inTime: undefined,
    totalCount: undefined,
    totalPrice: undefined,
    remark: undefined,
    fileUrl: undefined,
    items: []
  }
  formRef.value?.resetFields()
}
</script>
