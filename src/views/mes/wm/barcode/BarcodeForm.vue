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
      <el-form-item v-if="formData.bizType === BarcodeBizTypeEnum.AREA" label="库区" prop="bizId">
        <div class="space-y-2">
          <WmWarehouseSelect
            v-model="areaWarehouseId"
            @change="handleAreaWarehouseChange"
            class="!w-1/1"
            placeholder="请选择仓库"
          />
          <WmWarehouseLocationSelect
            v-model="areaLocationId"
            :warehouse-id="areaWarehouseId"
            @change="handleAreaLocationChange"
            class="!w-1/1"
            placeholder="请选择库位"
          />
          <WmWarehouseAreaSelect
            v-model="formData.bizId"
            :warehouse-id="areaWarehouseId"
            @change="handleBizSelect"
            class="!w-1/1"
            placeholder="请选择库区"
          />
        </div>
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.WORKORDER"
        label="工单"
        prop="bizId"
      >
        <ProWorkOrderSelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1//1" />
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.MACHINERY"
        label="设备"
        prop="bizId"
      >
        <DvMachinerySelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1//1" />
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.ITEM"
        label="产品物料"
        prop="bizId"
        class="!w-1/1"
      >
        <MdItemSelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1/1" />
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.VENDOR"
        label="供应商"
        prop="bizId"
      >
        <MdVendorSelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1//1" />
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.WORKSTATION"
        label="工作站"
        prop="bizId"
      >
        <MdWorkstationSelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1/1" />
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.WORKSHOP"
        label="车间"
        prop="bizId"
      >
        <MdWorkshopSelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1/1" />
      </el-form-item>
      <el-form-item
        v-else-if="formData.bizType === BarcodeBizTypeEnum.USER"
        label="人员"
        prop="bizId"
      >
        <UserSelect v-model="formData.bizId" @change="handleBizSelect" class="!w-1/1" />
      </el-form-item>
      <!-- TODO @芋艿：以下业务类型暂无对应的 Select 组件：PACKAGE(装箱单)、STOCK(库存)、BATCH(批次)、PROCARD(流转卡)、TRANSORDER(流转单)、TOOL(工装) -->
      <el-form-item v-else-if="formData.bizType" label="暂未接入" prop="bizId">
        <el-input-number
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
          disabled
        />
      </el-form-item>
      <el-form-item label="业务名称" prop="bizName">
        <el-input
          v-model="formData.bizName"
          placeholder="请输入业务名称"
          disabled
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
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import MdWorkshopSelect from '@/views/mes/md/workstation/components/MdWorkshopSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'

defineOptions({ name: 'BarcodeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<WmBarcodeVO>({
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

const areaWarehouseId = ref<number>() // 库区选择器的临时数据：选择仓库后，传给库区选择器，加载对应仓库的库区列表
const areaLocationId = ref<number>() // 库区选择器的临时数据：选择库位后，传给库区选择器，加载对应库位的库区列表

/** 业务 Select 选中回调：自动填充 bizId、bizCode、bizName */
const handleBizSelect = (item: any) => {
  if (!item) {
    formData.value.bizId = undefined
    formData.value.bizCode = undefined
    formData.value.bizName = undefined
    return
  }
  formData.value.bizId = item.id
  formData.value.bizCode = item.code || item.username
  formData.value.bizName = item.name || item.nickname
}

/** 库区仓库选择回调：清空库位和库区 */
const handleAreaWarehouseChange = () => {
  areaLocationId.value = undefined
  formData.value.bizId = undefined
  formData.value.bizCode = undefined
  formData.value.bizName = undefined
}

/** 库区库位选择回调：清空库区 */
const handleAreaLocationChange = () => {
  formData.value.bizId = undefined
  formData.value.bizCode = undefined
  formData.value.bizName = undefined
}

/** bizType 切换时，清空业务字段 */
watch(
  () => formData.value.bizType,
  () => {
    formData.value.bizId = undefined
    formData.value.bizCode = undefined
    formData.value.bizName = undefined
    // 清空库区的临时数据
    areaWarehouseId.value = undefined
    areaLocationId.value = undefined
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
