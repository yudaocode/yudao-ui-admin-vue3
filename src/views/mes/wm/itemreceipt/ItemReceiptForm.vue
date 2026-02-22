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
          <!-- 入库单编号：新增时可自动生成，编辑时不可生成 -->
          <el-form-item label="入库单编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入入库单编号">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入入库单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="采购订单编号" prop="purchaseOrderCode">
            <el-input v-model="formData.purchaseOrderCode" placeholder="请输入采购订单编号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <!-- TODO @AI：使用 select 组件，已经封装 -->
          <el-form-item label="供应商" prop="vendorId">
            <el-select
              v-model="formData.vendorId"
              placeholder="请选择供应商"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="vendor in vendorList"
                :key="vendor.id"
                :label="vendor.name"
                :value="vendor.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- TODO @AI：使用 select 组件，已经封装 -->
          <el-form-item label="仓库" prop="warehouseId">
            <el-select
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="warehouse in warehouseList"
                :key="warehouse.id"
                :label="warehouse.name"
                :value="warehouse.id"
              />
            </el-select>
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
            />
          </el-form-item>
        </el-col>
        <!-- TODO @AI：到货通知单（id，封装一个 select 组件，对方，参考其他的） -->
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 编辑时展示行项目信息（入库物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">行项目信息</el-divider>
      <ItemReceiptLineList :receipt-id="formData.id" />
    </template>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmItemReceiptApi, WmItemReceiptVO } from '@/api/mes/wm/itemreceipt'
import { MdVendorApi } from '@/api/mes/md/vendor'
import { WmWarehouseApi } from '@/api/mes/wm/warehouse'
import ItemReceiptLineList from './ItemReceiptLineList.vue'

defineOptions({ name: 'ItemReceiptForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const vendorList = ref<any[]>([]) // 供应商列表
const warehouseList = ref<any[]>([]) // 仓库列表
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  noticeId: undefined,
  iqcId: undefined,
  receiptDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '入库单编号不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 生成入库单编号 */
const generateCode = () => {
  formData.value.code = 'IR' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载供应商和仓库列表
  const [vendors, warehouses] = await Promise.all([
    MdVendorApi.getVendorSimpleList(),
    WmWarehouseApi.getWarehouseSimpleList()
  ])
  vendorList.value = vendors
  warehouseList.value = warehouses
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmItemReceiptApi.getItemReceipt(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmItemReceiptVO
    if (formType.value === 'create') {
      await WmItemReceiptApi.createItemReceipt(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmItemReceiptApi.updateItemReceipt(data)
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
    purchaseOrderCode: undefined,
    vendorId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    noticeId: undefined,
    iqcId: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
