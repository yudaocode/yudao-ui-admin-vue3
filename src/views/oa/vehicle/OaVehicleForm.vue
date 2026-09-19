<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <DeptSelect v-model="formData.deptId" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="车牌号" prop="no">
            <el-input v-model="formData.no" placeholder="请输入车牌号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="车辆名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入车辆名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_VEHICLE_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="车型" prop="type">
            <el-input v-model="formData.type" placeholder="请输入车型" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="车辆分类" prop="category">
            <el-select v-model="formData.category" placeholder="请选择车辆分类" clearable>
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.OA_VEHICLE_CATEGORY)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="品牌型号" prop="brandModel">
            <el-input v-model="formData.brandModel" placeholder="请输入品牌型号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="座位数" prop="seatCount">
            <el-input-number
              v-model="formData.seatCount"
              :min="1"
              :precision="0"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="裸车价格（元）" prop="barePrice">
            <el-input-number
              v-model="formData.barePrice"
              :min="0"
              :precision="2"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="交强险到期时间" prop="compulsoryInsuranceExpireTime">
            <el-date-picker
              v-model="formData.compulsoryInsuranceExpireTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择交强险到期时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商业险到期时间" prop="commercialInsuranceExpireTime">
            <el-date-picker
              v-model="formData.commercialInsuranceExpireTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择商业险到期时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年检到期时间" prop="inspectionExpireTime">
            <el-date-picker
              v-model="formData.inspectionExpireTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择年检到期时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="车辆照片" prop="picUrl">
            <UploadImg v-model="formData.picUrl" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示顺序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              :min="0"
              :precision="0"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              placeholder="请输入备注"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { OA_VEHICLE_STATUS } from '@/views/oa/utils/constants'
import * as VehicleApi from '@/api/oa/vehicle'

defineOptions({ name: 'OaVehicleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：修改时加载数据、提交时禁用按钮
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<VehicleApi.VehicleVO>({ picUrl: '' }) // 表单数据

const formRules = reactive<FormRules>({
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  no: [{ required: true, message: '车牌号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '车辆名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '车型不能为空', trigger: 'blur' }],
  seatCount: [{ required: true, message: '座位数不能为空', trigger: 'change' }],
  barePrice: [{ required: true, message: '裸车价格不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '显示顺序不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单引用

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时加载已有信息
  if (id) {
    formLoading.value = true
    try {
      formData.value = await VehicleApi.getVehicle(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 1. 校验表单
  await formRef.value.validate()
  // 2. 保存基础信息
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await VehicleApi.createVehicle(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await VehicleApi.updateVehicle(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    no: '',
    name: '',
    deptId: undefined,
    status: OA_VEHICLE_STATUS.IDLE,
    type: '',
    category: '',
    brandModel: '',
    seatCount: undefined,
    barePrice: undefined,
    compulsoryInsuranceExpireTime: undefined,
    commercialInsuranceExpireTime: undefined,
    inspectionExpireTime: undefined,
    picUrl: '',
    sort: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
