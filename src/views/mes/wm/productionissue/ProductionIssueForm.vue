<!-- 表单布局：一行 3 个字段 -->
<!-- 必填字段：领料单编号（必填）、领料单名称（必填）、需求时间（必填）、生产工单（必填）、工作站 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1200px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="领料单编号" prop="code">
            <el-input v-model="formData.code" placeholder="自动生成" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="领料单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入领料单名称" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需求时间" prop="requiredTime">
            <el-date-picker
              v-model="formData.requiredTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择需求时间"
              :disabled="isDetail"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workorderId">
            <el-input
              v-model="formData.workorderCode"
              placeholder="请选择工单"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站" prop="workstationId">
            <el-input
              v-model="formData.workstationCode"
              placeholder="请选择工作站"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 领料明细 -->
      <!-- TODO @AI：参考别的模块，独立文件； -->
      <el-divider content-position="left">领料明细</el-divider>
      <el-row>
        <el-col :span="24">
          <el-button type="primary" @click="handleAddLine" v-if="!isDetail" class="mb-10px">
            <Icon icon="ep:plus" class="mr-5px" /> 添加物料
          </el-button>
          <el-table :data="formData.lines" border>
            <el-table-column label="物料编码" prop="itemCode" width="150">
              <template #default="{ row, $index }">
                <el-input
                  v-model="row.itemCode"
                  placeholder="请输入物料编码"
                  :disabled="isDetail"
                />
              </template>
            </el-table-column>
            <el-table-column label="物料名称" prop="itemName" width="150">
              <template #default="{ row, $index }">
                <el-input
                  v-model="row.itemName"
                  placeholder="请输入物料名称"
                  :disabled="isDetail"
                />
              </template>
            </el-table-column>
            <el-table-column label="规格型号" prop="specification" width="150">
              <template #default="{ row, $index }">
                <el-input
                  v-model="row.specification"
                  placeholder="请输入规格型号"
                  :disabled="isDetail"
                />
              </template>
            </el-table-column>
            <el-table-column label="单位" prop="unitOfMeasure" width="100">
              <template #default="{ row, $index }">
                <el-input v-model="row.unitOfMeasure" placeholder="单位" :disabled="isDetail" />
              </template>
            </el-table-column>
            <el-table-column label="领料数量" prop="quantityIssued" width="120">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.quantityIssued"
                  :min="0"
                  :precision="2"
                  :disabled="isDetail"
                  class="!w-full"
                />
              </template>
            </el-table-column>
            <el-table-column label="批次号" prop="batchCode" width="120">
              <template #default="{ row, $index }">
                <el-input v-model="row.batchCode" placeholder="批次号" :disabled="isDetail" />
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" min-width="150">
              <template #default="{ row, $index }">
                <el-input v-model="row.remark" placeholder="备注" :disabled="isDetail" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="80" v-if="!isDetail">
              <template #default="{ row, $index }">
                <el-button link type="danger" @click="handleDeleteLine($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" v-if="!isDetail">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmProductionIssueApi, WmProductionIssueVO } from '@/api/mes/wm/production-issue'

defineOptions({ name: 'IssueForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const isDetail = ref(false)
const formData = ref<WmProductionIssueVO>({
  id: undefined,
  name: '',
  workorderId: undefined,
  workorderCode: '',
  workstationId: undefined,
  workstationCode: '',
  requiredTime: undefined,
  remark: '',
  lines: []
})
const formRules = reactive({
  name: [{ required: true, message: '领料单名称不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value =
    type === 'create' ? '新增领料出库单' : type === 'update' ? '修改领料出库单' : '领料出库单详情'
  formType.value = type
  isDetail.value = type === 'detail'
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductionIssueApi.getIssue(id)
      if (!formData.value.lines) {
        formData.value.lines = []
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await WmProductionIssueApi.createIssue(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmProductionIssueApi.updateIssue(data)
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
    name: '',
    workorderId: undefined,
    workorderCode: '',
    workstationId: undefined,
    workstationCode: '',
    requiredTime: undefined,
    remark: '',
    lines: []
  }
  formRef.value?.resetFields()
}

/** 添加行 */
const handleAddLine = () => {
  if (!formData.value.lines) {
    formData.value.lines = []
  }
  formData.value.lines.push({
    itemId: 0,
    itemCode: '',
    itemName: '',
    specification: '',
    unitOfMeasure: '',
    quantityIssued: 1,
    batchCode: '',
    remark: ''
  })
}

/** 删除行 */
const handleDeleteLine = (index: number) => {
  formData.value.lines?.splice(index, 1)
}
</script>
