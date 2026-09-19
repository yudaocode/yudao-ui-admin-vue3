<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1200px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="关联出差申请" prop="travelApplyId">
            <el-input
              :model-value="formData.travelApplyNo"
              readonly
              placeholder="请选择出差申请单（可选）"
              @click="applySelectRef.open(formData.travelApplyId)"
            >
              <template #suffix><Icon icon="ep:search" /></template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="出差事由" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="2"
          placeholder="请输入出差事由"
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始日期" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              value-format="x"
              placeholder="请选择开始日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              value-format="x"
              placeholder="请选择结束日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出差天数">
            <el-input :model-value="days" placeholder="自动计算" disabled>
              <template #append>天</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="报销总金额">
            <el-input :model-value="totalPrice" placeholder="自动汇总" disabled>
              <template #append>元</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :is-show-tip="false" />
      </el-form-item>
      <div class="mb-12px mt-20px flex items-center justify-between">
        <span class="font-bold">费用明细</span>
        <el-button type="primary" plain @click="addItem">添加费用</el-button>
      </div>
      <el-table :data="formData.items" border show-summary :summary-method="getSummaries">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="费用类型" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.expenseType" clearable placeholder="请选择费用类型">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_EXPENSE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="发生日期" min-width="160">
          <template #default="{ row }">
            <el-date-picker
              v-model="row.expenseTime"
              type="date"
              value-format="x"
              placeholder="请选择发生日期"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="出发地" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.departureCity" placeholder="请输入出发地" />
          </template>
        </el-table-column>
        <el-table-column label="到达地" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.arrivalCity" placeholder="请输入到达地" />
          </template>
        </el-table-column>
        <el-table-column
          label="金额(元)"
          prop="price"
          min-width="160"
          align="right"
          header-align="center"
        >
          <template #header>
            <span class="mr-4px text-[var(--el-color-danger)]">*</span>
            金额(元)
          </template>
          <template #default="{ row }">
            <el-input-number
              v-model="row.price"
              :min="0"
              :precision="2"
              controls-position="right"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="费用说明" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.description" placeholder="请输入费用说明" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="75" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" @click="deleteItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button
        v-hasPermi="['oa:travel-reimbursement:save']"
        :disabled="formLoading"
        type="primary"
        @click="submitForm"
      >
        保 存
      </el-button>
      <el-button :disabled="formLoading" @click="dialogVisible = false">取 消</el-button>
    </template>

    <OaTravelApplySelect ref="applySelectRef" @select="handleApplySelect" />
  </Dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { TableColumnCtx } from 'element-plus'
import * as TravelApi from '@/api/oa/travel/reimbursement'
import type { TravelApplyVO } from '@/api/oa/travel/apply'
import OaTravelApplySelect from '@/views/oa/travel/apply/components/OaTravelApplySelect.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaTravelReimbursementForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载及保存状态
const formData = ref<TravelApi.TravelReimbursementVO>({
  status: BpmProcessInstanceStatus.NOT_START,
  items: [],
  fileUrls: []
}) // 单据
const formRules = reactive({
  reason: [{ required: true, message: '出差事由不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束日期不能为空', trigger: 'change' }],
  fileUrls: [{ type: 'array', required: true, message: '请上传报销附件', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const applySelectRef = ref() // 关联出差申请选择弹窗

/** 按经过的时长计算天数，以 24 小时为一天，向上取整 */
const days = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) return undefined
  return Math.ceil(
    dayjs(Number(formData.value.endTime)).diff(
      dayjs(Number(formData.value.startTime)),
      'hour',
      true
    ) / 24
  )
})

/** 报销总金额，最终以服务端计算结果为准 */
const totalPrice = computed(() =>
  (
    formData.value.items.reduce((sum, item) => sum + Math.round((item.price || 0) * 100), 0) / 100
  ).toFixed(2)
)

/** 费用表合计，与单据头部使用同一金额 */
function getSummaries({
  columns
}: {
  columns: TableColumnCtx<TravelApi.TravelReimbursementItemVO>[]
}) {
  return columns.map((column, index) =>
    index === 0 ? '合计' : column.property === 'price' ? totalPrice.value : ''
  )
}

/** 选择关联单据，仅带入事由及出差日期，仍允许独立修改 */
function handleApplySelect(apply: TravelApplyVO) {
  formData.value.travelApplyId = apply.id
  formData.value.travelApplyNo = apply.no
  formData.value.reason = apply.reason
  formData.value.startTime = apply.startTime
  formData.value.endTime = apply.endTime
}

/** 新增明细 */
function addItem() {
  formData.value.items.push({})
}

/** 删除明细 */
function deleteItem(index: number) {
  formData.value.items.splice(index, 1)
}

/** 打开表单 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type) + '差旅报销'
  resetForm()
  // 修改时，加载单据及明细
  if (!id) return
  formLoading.value = true
  try {
    formData.value = await TravelApi.getTravelReimbursement(id)
    // TODO DONE @AI：详情直接回填，明细由接口保证，附件空值由上传组件处理。
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单：保存草稿，审批由列表发起 */
const emit = defineEmits(['success']) // 保存成功后刷新列表
async function submitForm() {
  // 1. 校验表单及明细
  const valid = await formRef.value.validate()
  if (!valid) return
  if (!formData.value.items.length) {
    return message.warning('请添加费用明细')
  }
  if (formData.value.items.some((item) => item.price === undefined || item.price === null)) {
    return message.warning('请填写每行费用金额')
  }

  // 2. 保存单据
  formLoading.value = true
  try {
    if (formData.value.id) {
      await TravelApi.updateTravelReimbursement(formData.value)
    } else {
      formData.value.id = await TravelApi.createTravelReimbursement(formData.value)
    }
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单，避免再次新增时带入上次单据 */
function resetForm() {
  formData.value = {
    status: BpmProcessInstanceStatus.NOT_START,
    items: [],
    fileUrls: []
  }
  formRef.value?.resetFields()
}
</script>
