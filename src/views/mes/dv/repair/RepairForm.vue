<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row>
        <!-- TODO @ai：生成 -->
        <el-col :span="8">
          <el-form-item label="维修单编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入维修单编码" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="维修单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入维修单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="设备" prop="machineryId">
            <DvMachinerySelect v-model="formData.machineryId" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="报修日期" prop="requireDate">
            <el-date-picker
              v-model="formData.requireDate"
              type="datetime"
              value-format="x"
              placeholder="选择报修日期"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="维修完成日期" prop="finishDate">
            <el-date-picker
              v-model="formData.finishDate"
              type="datetime"
              value-format="x"
              placeholder="选择完成日期"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="验收日期" prop="confirmDate">
            <el-date-picker
              v-model="formData.confirmDate"
              type="datetime"
              value-format="x"
              placeholder="选择验收日期"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="维修结果" prop="result">
            <el-select v-model="formData.result" placeholder="请选择维修结果" clearable>
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="维修人" prop="acceptedUserId">
            <UserSelect v-model="formData.acceptedUserId" placeholder="请选择维修人" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="验收人" prop="confirmUserId">
            <UserSelect v-model="formData.confirmUserId" placeholder="请选择验收人" />
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
    <!-- 编辑时展示维修项目明细 -->
    <template v-if="formData.id">
      <el-divider content-position="center">维修项目明细</el-divider>
      <RepairLineList :repair-id="formData.id" />
    </template>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DvRepairApi } from '@/api/mes/dv/repair'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import RepairLineList from './RepairLineList.vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'RepairForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  code: '',
  name: '',
  machineryId: undefined,
  requireDate: undefined,
  finishDate: undefined,
  confirmDate: undefined,
  result: undefined,
  acceptedUserId: undefined,
  confirmUserId: undefined,
  remark: ''
})
const formRules = reactive({
  code: [{ required: true, message: '维修单编码不能为空', trigger: 'blur' }],
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await DvRepairApi.getRepair(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as any
    if (formType.value === 'create') {
      await DvRepairApi.createRepair(data)
      message.success(t('common.createSuccess'))
    } else {
      await DvRepairApi.updateRepair(data)
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
    code: '',
    name: '',
    machineryId: undefined,
    requireDate: undefined,
    finishDate: undefined,
    confirmDate: undefined,
    result: undefined,
    acceptedUserId: undefined,
    confirmUserId: undefined,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
