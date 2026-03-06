<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="条码格式" prop="format">
        <el-select v-model="formData.format" placeholder="请选择条码格式" class="!w-1/1">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_FORMAT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="formData.bizType" placeholder="请选择业务类型" class="!w-1/1">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI： 判断 formData.bizType === BarcodeBizTypeEnum.ITEM
        <el-form-item label="产品物料" prop="bizId">
      -->
      <!-- TODO @AI： 判断 formData.bizType === BarcodeBizTypeEnum.AREA，不用 BarcodeBizTypeEnum.WAREHOUSE
        使用 WmWarehouseSelect、
        WmWarehouseLocationSelect
        、WmWarehouseAreaSelect、
      -->
      <!-- TODO @AI： 判断 formData.bizType === BarcodeBizTypeEnum.PACKAGE，缺了 package。（暂时没封装 select，跳过先）
      -->
      <!-- TODO @AI： 判断 formData.bizType === BarcodeBizTypeEnum.VENDOR，
          <el-form-item label="供应商" prop="bizId">
       -->
      <!-- todo @AI：判断 WORKSTATION
        使用对应的选择器；“工作站”
       -->
      <!-- TODO @AI：判断 STOCK；暂时不用；
      -->
      <!-- TODO @AI：判断 BATCH；暂时不用；
       -->
      <!-- TODO @AI：判断： WORKSHOP
        “车间”（是不是叫这个？？？）
       -->
      <!-- TODO @AI：判断：设备 “MACHINERY”
        使用 select；
      -->
      <!-- TODO @AI：判断 人员 USER
      使用 user select；
        -->
      <!-- TODO @AI：判断流转卡；PROCARD
      使用对应的 select
       -->
      <el-form-item label="业务对象" prop="bizId">
        <!-- 已有 Select 组件的业务类型 -->
        <WmWarehouseSelect
          v-if="formData.bizType === BarcodeBizTypeEnum.WAREHOUSE"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <WmWarehouseAreaSelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.AREA"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <ProWorkOrderSelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.WORKORDER"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <DvMachinerySelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.MACHINERY"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <MdItemSelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.ITEM"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <MdVendorSelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.VENDOR"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <MdWorkstationSelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.WORKSTATION"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <MdWorkshopSelect
          v-else-if="formData.bizType === BarcodeBizTypeEnum.WORKSHOP"
          v-model="formData.bizId"
          @change="handleBizSelect"
          class="!w-240px"
        />
        <!-- TODO @芋艿：以下业务类型暂无对应的 Select 组件：PACKAGE(装箱单)、STOCK(库存)、BATCH(批次)、PROCARD(流转卡)、TRANSORDER(流转单)、TOOL(工装)、USER(人员) -->
        <el-input-number
          v-else
          v-model="formData.bizId"
          :min="1"
          class="!w-240px"
          placeholder="请输入业务编号"
        />
      </el-form-item>
      <el-form-item label="业务编码" prop="bizCode">
        <el-input
          v-model="formData.bizCode"
          placeholder="请输入业务编码"
          :disabled="hasBizSelect"
        />
      </el-form-item>
      <el-form-item label="业务名称" prop="bizName">
        <el-input
          v-model="formData.bizName"
          placeholder="请输入业务名称"
          :disabled="hasBizSelect"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
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
import { CommonStatusEnum } from '@/utils/constants'
import { WmBarcodeApi, type WmBarcodeVO } from '@/api/mes/wm/barcode'
import { BarcodeBizTypeEnum } from '@/views/mes/utils/constants'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import MdWorkshopSelect from '@/views/mes/md/workstation/components/MdWorkshopSelect.vue'

defineOptions({ name: 'BarcodeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  format: undefined,
  bizType: undefined,
  bizId: undefined,
  bizCode: undefined,
  bizName: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: ''
})
const formRules = reactive({
  format: [{ required: true, message: '条码格式不能为空', trigger: 'change' }],
  bizType: [{ required: true, message: '业务类型不能为空', trigger: 'change' }],
  bizId: [{ required: true, message: '业务编号不能为空', trigger: 'blur' }],
  bizCode: [{ required: true, message: '业务编码不能为空', trigger: 'blur' }],
  bizName: [{ required: true, message: '业务名称不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 有 Select 组件的业务类型集合 */
const BIZ_TYPES_WITH_SELECT = [
  BarcodeBizTypeEnum.WAREHOUSE,
  BarcodeBizTypeEnum.AREA,
  BarcodeBizTypeEnum.WORKORDER,
  BarcodeBizTypeEnum.MACHINERY,
  BarcodeBizTypeEnum.ITEM,
  BarcodeBizTypeEnum.VENDOR,
  BarcodeBizTypeEnum.WORKSTATION,
  BarcodeBizTypeEnum.WORKSHOP
] as number[]

/** 当前 bizType 是否有对应的 Select 组件 */
// TODO @AI：这里 linter 报错；
const hasBizSelect = computed(() =>
  BIZ_TYPES_WITH_SELECT.includes(formData.value.bizType as number)
)

/** 业务 Select 选中回调：自动填充 bizId、bizCode、bizName */
const handleBizSelect = (item: any) => {
  if (!item) {
    formData.value.bizId = undefined
    formData.value.bizCode = undefined
    formData.value.bizName = undefined
    return
  }
  formData.value.bizId = item.id
  formData.value.bizCode = item.code
  formData.value.bizName = item.name
}

/** bizType 切换时，清空业务字段 */
watch(
  () => formData.value.bizType,
  () => {
    formData.value.bizId = undefined
    formData.value.bizCode = undefined
    formData.value.bizName = undefined
  }
)

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增条码' : '修改条码'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmBarcodeApi.getBarcode(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmBarcodeVO
    if (formType.value === 'create') {
      await WmBarcodeApi.createBarcode(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmBarcodeApi.updateBarcode(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    format: undefined,
    bizType: undefined,
    bizId: undefined,
    bizCode: undefined,
    bizName: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
