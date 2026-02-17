<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="860px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <!-- TODO @AI：生成，参考别的界面 -->
          <el-form-item label="库区编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入库区编码" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库区名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入库区名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="所属仓库" prop="warehouseId">
            <el-select v-model="formData.warehouseId" placeholder="请选择仓库" class="!w-1/1">
              <el-option
                v-for="warehouse in warehouseList"
                :key="warehouse.id"
                :label="warehouse.name"
                :value="warehouse.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="面积" prop="area">
            <el-input-number
              v-model="formData.area"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库位管理" prop="areaEnabled">
            <el-switch v-model="formData.areaEnabled" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
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
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="是否冻结" prop="frozen">
            <el-switch v-model="formData.frozen" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <!-- TODO @AI：barcodeimg -->
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'

defineOptions({ name: 'LocationForm' })

// TODO @AI：变量注释，模仿下别的模块
const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const warehouseList = ref<WmWarehouseVO[]>([])
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  warehouseId: undefined,
  area: undefined,
  areaEnabled: true,
  status: CommonStatusEnum.ENABLE,
  frozen: false,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '库区名称不能为空', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '所属仓库不能为空', trigger: 'change' }],
  areaEnabled: [{ required: true, message: '库位管理开关不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  frozen: [{ required: true, message: '是否冻结不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number, defaultWarehouseId?: number) => {
  // TODO @AI：注释的风格，参考下别的模块的 form；
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  warehouseList.value = await WmWarehouseApi.getWarehouseSimpleList()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmWarehouseLocationApi.getWarehouseLocation(id)
    } finally {
      formLoading.value = false
    }
    return
  }
  // TODO @linter：修复
  if (defaultWarehouseId) {
    formData.value.warehouseId = defaultWarehouseId
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // TODO @AI：注释的风格，参考下别的模块的 form；
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmWarehouseLocationVO
    if (formType.value === 'create') {
      await WmWarehouseLocationApi.createWarehouseLocation(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmWarehouseLocationApi.updateWarehouseLocation(data)
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
    code: undefined,
    name: undefined,
    warehouseId: undefined,
    area: undefined,
    areaEnabled: true,
    status: CommonStatusEnum.ENABLE,
    frozen: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
