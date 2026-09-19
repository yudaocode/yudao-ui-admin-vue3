<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1100px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题" maxlength="255" />
      </el-form-item>
      <el-form-item label="紧急程度" prop="urgency">
        <el-select v-model="formData.urgency" placeholder="请选择紧急程度" class="!w-full">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_APPLY_URGENCY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="证明人" prop="witnessUserId">
        <UserSelect v-model="formData.witnessUserId" placeholder="请选择证明人" />
      </el-form-item>
      <el-form-item label="相关客户" prop="customerName">
        <el-input v-model="formData.customerName" placeholder="请输入相关客户" maxlength="255" />
      </el-form-item>
      <el-form-item label="报销方式" prop="paymentMethod">
        <el-select v-model="formData.paymentMethod" placeholder="请选择报销方式" class="!w-full">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_REIMBURSEMENT_PAYMENT_METHOD)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="申请原因" prop="reason">
        <el-input
          v-model="formData.reason"
          maxlength="5000"
          placeholder="请输入申请原因"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :is-show-tip="false" />
      </el-form-item>
      <!-- 报销费用明细 -->
      <div class="mb-12px flex items-center justify-between">
        <span class="font-bold">报销明细</span>
        <el-button type="primary" plain @click="addItem">新增明细</el-button>
      </div>
      <el-table :data="formData.items" border>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="费用发生时间" min-width="210">
          <template #default="{ row }">
            <el-date-picker
              v-model="row.expenseTime"
              type="datetime"
              value-format="x"
              placeholder="请选择费用时间"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="费用类型" min-width="160">
          <template #default="{ row }">
            <el-select v-model="row.expenseType" placeholder="请选择费用类型">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_EXPENSE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="费用说明" min-width="160">
          <template #default="{ row, $index }">
            <el-form-item
              :prop="`items.${$index}.description`"
              :rules="[{ required: true, message: '费用说明不能为空', trigger: 'blur' }]"
              class="!mb-0"
            >
              <el-input v-model="row.description" placeholder="请输入费用说明" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="票据张数" min-width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.invoiceCount"
              :min="0"
              :precision="0"
              :max="2147483647"
              controls-position="right"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="报销金额" min-width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.price"
              :min="0"
              :precision="2"
              :max="9999999999999999.99"
              controls-position="right"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="75">
          <template #default="{ $index }">
            <el-button link type="danger" @click="deleteItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="my-12px text-right">
        票据合计：{{ invoiceCount }} 张；金额合计：{{ totalPrice }} 元
      </div>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as ReimbursementApi from '@/api/oa/reimbursement'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import type { FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'OaReimbursementForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<ReimbursementApi.ReimbursementVO>({ items: [], fileUrls: [] }) // 表单数据
const formRules = reactive<FormRules>({
  customerName: [{ required: true, message: '相关客户不能为空', trigger: 'blur' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  urgency: [{ required: true, message: '紧急程度不能为空', trigger: 'change' }],
  witnessUserId: [{ required: true, message: '证明人不能为空', trigger: 'change' }],
  paymentMethod: [{ required: true, message: '报销方式不能为空', trigger: 'change' }],
  reason: [{ required: true, message: '申请原因不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

const totalPrice = computed(
  () =>
    (formData.value.items || []).reduce(
      (total, item) => total + Math.round((item.price || 0) * 100),
      0
    ) / 100
) // 报销总金额
const invoiceCount = computed(() =>
  (formData.value.items || []).reduce((total, item) => total + (item.invoiceCount || 0), 0)
) // 票据总数

/** 新增费用明细 */
function addItem() {
  formData.value.items!.push({ invoiceCount: 0, price: 0 })
}

/** 删除费用明细 */
function deleteItem(index: number) {
  formData.value.items!.splice(index, 1)
}

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ReimbursementApi.getReimbursement(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ReimbursementApi.createReimbursement(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ReimbursementApi.updateReimbursement(formData.value)
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
function resetForm() {
  formData.value = { items: [], fileUrls: [] }
  formRef.value?.resetFields()
}
</script>
