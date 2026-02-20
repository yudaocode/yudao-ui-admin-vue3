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
        <el-col :span="8">
          <el-form-item label="设备" prop="machineryId">
            <DvMachinerySelect v-model="formData.machineryId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="点检计划" prop="planId">
            <DvCheckPlanSelect v-model="formData.planId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="点检人" prop="userId">
            <UserSelect v-model="formData.userId" placeholder="请选择点检人" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="点检时间" prop="checkTime">
            <el-date-picker
              v-model="formData.checkTime"
              type="datetime"
              value-format="x"
              placeholder="选择点检时间"
            />
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
    <!-- 编辑时展示点检项目明细 -->
    <template v-if="formData.id">
      <el-divider content-position="center">点检项目明细</el-divider>
      <CheckRecordLineList :record-id="formData.id" />
    </template>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DvCheckRecordApi } from '@/api/mes/dv/checkrecord'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import DvCheckPlanSelect from '@/views/mes/dv/checkplan/components/DvCheckPlanSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import CheckRecordLineList from './CheckRecordLineList.vue'

defineOptions({ name: 'CheckRecordForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  planId: undefined,
  machineryId: undefined,
  checkTime: undefined,
  userId: undefined,
  status: undefined,
  remark: ''
})
const formRules = reactive({
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
  checkTime: [{ required: true, message: '点检时间不能为空', trigger: 'blur' }]
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
      formData.value = await DvCheckRecordApi.getCheckRecord(id)
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
      await DvCheckRecordApi.createCheckRecord(data)
      message.success(t('common.createSuccess'))
    } else {
      await DvCheckRecordApi.updateCheckRecord(data)
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
    planId: undefined,
    machineryId: undefined,
    checkTime: undefined,
    userId: undefined,
    status: undefined,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
