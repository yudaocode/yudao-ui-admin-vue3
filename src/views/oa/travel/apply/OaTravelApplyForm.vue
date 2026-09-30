<!-- TODO DONE @AI：变量及 open、submitForm、resetForm 顺序和步骤注释对齐 System 用户表单。 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1200px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="出差事由" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="2"
          placeholder="请输入出差事由"
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="9">
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
        <el-col :span="9">
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
        <el-col :span="6">
          <el-form-item label="出差天数">
            <el-input :model-value="days" placeholder="自动计算" disabled>
              <template #append>天</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="同行人" prop="companion">
            <el-input v-model="formData.companion" placeholder="请输入同行人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计费用" prop="estimatedPrice">
            <el-input-number
              v-model="formData.estimatedPrice"
              placeholder="请输入预计费用"
              :min="0"
              :precision="2"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <!-- TODO DONE @AI：OA 附件上传统一使用 UploadFile 默认格式。 -->
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :is-show-tip="false" />
      </el-form-item>

      <div class="mb-12px mt-20px flex items-center justify-between">
        <span class="font-bold">行程明细</span>
        <el-button type="primary" plain @click="addItem">添加行程</el-button>
      </div>
      <el-table :data="formData.items" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="出发城市" min-width="180">
          <template #default="{ row }">
            <AreaSelect
              v-model="row.departureAreaId"
              check-strictly
              placeholder="请选择出发城市"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="到达城市" min-width="180">
          <template #default="{ row }">
            <AreaSelect
              v-model="row.arrivalAreaId"
              check-strictly
              placeholder="请选择到达城市"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="开始日期" min-width="160">
          <template #default="{ row }">
            <el-date-picker
              v-model="row.startTime"
              type="date"
              value-format="x"
              placeholder="请选择开始日期"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="结束日期" min-width="160">
          <template #default="{ row }">
            <el-date-picker
              v-model="row.endTime"
              type="date"
              value-format="x"
              placeholder="请选择结束日期"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="交通方式" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.transportType" clearable placeholder="请选择交通方式">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_TRANSPORT_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="请输入备注" />
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
        v-hasPermi="['oa:travel-apply:save']"
        :disabled="formLoading"
        type="primary"
        @click="submitForm"
      >
        保 存
      </el-button>
      <el-button :disabled="formLoading" @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import * as TravelApi from '@/api/oa/travel/apply'
import AreaSelect from '@/views/system/area/components/AreaSelect.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaTravelApplyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载及保存状态
const formData = ref<TravelApi.TravelApplyVO>({
  status: BpmProcessInstanceStatus.NOT_START,
  items: [],
  fileUrls: []
}) // 单据
const formRules = reactive({
  reason: [{ required: true, message: '出差事由不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束日期不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref

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
  dialogTitle.value = t('action.' + type) + '出差申请'
  resetForm()
  // 修改时，加载单据及明细
  if (!id) return
  formLoading.value = true
  try {
    formData.value = await TravelApi.getTravelApply(id)
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
    return message.warning('请添加行程明细')
  }
  // 2. 保存单据
  formLoading.value = true
  try {
    if (formData.value.id) {
      await TravelApi.updateTravelApply(formData.value)
    } else {
      formData.value.id = await TravelApi.createTravelApply(formData.value)
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
  formData.value = { status: BpmProcessInstanceStatus.NOT_START, items: [], fileUrls: [] }
  formRef.value?.resetFields()
}
</script>
