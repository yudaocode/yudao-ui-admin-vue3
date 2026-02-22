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
          <!-- 入库单编号：新增时可自动生成，其他模式不可生成 -->
          <el-form-item label="入库单编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入入库单编号" :disabled="isHeaderReadonly">
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
            <el-input v-model="formData.name" placeholder="请输入入库单名称" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="采购订单编号" prop="purchaseOrderCode">
            <el-input v-model="formData.purchaseOrderCode" placeholder="请输入采购订单编号" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect v-model="formData.warehouseId" :disabled="isHeaderReadonly" />
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
          <el-form-item label="到货通知单" prop="noticeId">
            <WmArrivalNoticeSelect
              v-model="formData.noticeId"
              :disabled="isHeaderReadonly"
              @change="handleNoticeChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示行项目信息（入库物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">行项目信息</el-divider>
      <ItemReceiptLineList :receipt-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <!-- create/update 模式 -->
      <template v-if="formType === 'create' || formType === 'update'">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
      <!-- shelving 模式 -->
      <template v-else-if="formType === 'shelving'">
        <el-button @click="handleShelving" type="primary" :disabled="formLoading">执行上架</el-button>
        <el-button @click="handleCancelReceipt" type="danger" :disabled="formLoading">取消入库单</el-button>
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </template>
      <!-- execute 模式 -->
      <template v-else-if="formType === 'execute'">
        <el-button @click="handleExecute" type="primary" :disabled="formLoading">执行入库</el-button>
        <el-button @click="handleCancelReceipt" type="danger" :disabled="formLoading">取消入库单</el-button>
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </template>
      <!-- detail 模式 -->
      <template v-else>
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </template>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmItemReceiptApi, WmItemReceiptVO } from '@/api/mes/wm/itemreceipt'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmArrivalNoticeSelect from '@/views/mes/wm/arrivalnotice/components/WmArrivalNoticeSelect.vue'
import ItemReceiptLineList from './ItemReceiptLineList.vue'

defineOptions({ name: 'ItemReceiptForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / shelving / execute / detail
const formData = ref({
  id: undefined as number | undefined,
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

/** Header fields are read-only in shelving/execute/detail modes */
const isHeaderReadonly = computed(() =>
  ['shelving', 'execute', 'detail'].includes(formType.value)
)

/** 弹窗标题映射 */
const dialogTitleMap: Record<string, string> = {
  create: '新增采购入库单',
  update: '编辑采购入库单',
  shelving: '执行上架',
  execute: '执行入库',
  detail: '采购入库单详情'
}

/** 生成入库单编号 */
const generateCode = () => {
  formData.value.code = 'IR' + generateRandomStr(10)
}

/** 到货通知单变化时，自动填充供应商和采购订单号 */
const handleNoticeChange = (notice: any) => {
  if (notice) {
    formData.value.vendorId = notice.vendorId
    formData.value.purchaseOrderCode = notice.purchaseOrderCode
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  dialogTitle.value = dialogTitleMap[type] || type
  resetForm()
  // 修改/上架/执行/详情时，加载数据
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

/** 提交表单（create/update 模式） */
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
      message.success('新增成功')
    } else {
      await WmItemReceiptApi.updateItemReceipt(data)
      message.success('修改成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 执行上架（shelving 模式） */
const handleShelving = async () => {
  try {
    await message.confirm('确认执行上架？')
    formLoading.value = true
    await WmItemReceiptApi.shelvingItemReceipt(formData.value.id!)
    message.success('上架成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行入库（execute 模式） */
const handleExecute = async () => {
  try {
    await message.confirm('确认执行入库？执行后将更新库存台账。')
    formLoading.value = true
    await WmItemReceiptApi.executeItemReceipt(formData.value.id!)
    message.success('入库成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 取消入库单 */
const handleCancelReceipt = async () => {
  try {
    await message.confirm('确认取消该采购入库单？取消后不可恢复。')
    formLoading.value = true
    await WmItemReceiptApi.cancelItemReceipt(formData.value.id!)
    message.success('取消成功')
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
