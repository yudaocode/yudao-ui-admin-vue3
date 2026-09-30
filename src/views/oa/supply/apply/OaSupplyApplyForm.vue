<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1000px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="单据编号">
        <el-input v-model="formData.no" placeholder="保存后自动生成" disabled />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="领用日期" prop="applyTime">
            <el-date-picker
              v-model="formData.applyTime"
              type="date"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择领用日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="使用类型" prop="useType">
            <el-select v-model="formData.useType" placeholder="请选择使用类型" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_USE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="领取方式" prop="pickupMethod">
            <el-select v-model="formData.pickupMethod" placeholder="请选择领取方式" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_PICKUP_METHOD)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="申请事由" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          placeholder="请输入申请事由"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :limit="10" :file-size="20" />
      </el-form-item>
      <!-- 领用明细 -->
      <div class="mb-3 flex items-center justify-between">
        <span class="font-bold">领用明细</span>
        <el-button type="primary" plain @click="itemSelectRef.open()">
          <Icon icon="ep:plus" /> 添加办公用品
        </el-button>
      </div>
      <el-table :data="formData.items" border show-overflow-tooltip>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="物品名称" prop="itemName" min-width="160" />
        <el-table-column label="规格型号" prop="model" min-width="120" />
        <el-table-column label="计量单位" prop="unit" width="90" align="center" />
        <el-table-column label="管理类型" width="110" align="center">
          <template #default="{ row }">
            <DictTag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
          </template>
        </el-table-column>
        <el-table-column label="领用数量" width="140">
          <template #default="{ row }">
            <el-input-number
              v-model="row.applyQuantity"
              :min="1"
              :precision="0"
              size="small"
              class="!w-full"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" @click="formData.items!.splice($index, 1)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <OaSupplyItemSelect ref="itemSelectRef" @select="handleSelectItem" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as SupplyApplyApi from '@/api/oa/supply/apply'
import type { SupplyItemVO } from '@/api/oa/supply/item'
import OaSupplyItemSelect from '@/views/oa/supply/item/components/OaSupplyItemSelect.vue'

defineOptions({ name: 'OaSupplyApplyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formData = ref<SupplyApplyApi.SupplyApplyVO>({ items: [], fileUrls: [] }) // 表单数据
const formRules = reactive({
  applyTime: [{ required: true, message: '领用日期不能为空', trigger: 'change' }],
  useType: [{ required: true, message: '使用类型不能为空', trigger: 'change' }],
  pickupMethod: [{ required: true, message: '领取方式不能为空', trigger: 'change' }],
  reason: [{ required: true, whitespace: true, message: '申请事由不能为空', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单引用
const itemSelectRef = ref() // 物品选择弹窗

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await SupplyApplyApi.getSupplyApply(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 选择领用物品 */
function handleSelectItem(item: SupplyItemVO) {
  if (formData.value.items!.some((row) => row.itemId === item.id)) {
    message.warning('该物品已添加')
    return
  }
  formData.value.items!.push({
    itemId: item.id,
    itemName: item.name,
    model: item.model,
    unit: item.unit,
    manageType: item.manageType,
    applyQuantity: 1
  })
}

const emit = defineEmits(['success']) // 操作成功

/** 保存申请，草稿仅表示尚未提交审批 */
async function submitForm() {
  // 1. 校验表单和领用数量
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!formData.value.items?.length) {
    return message.warning('请添加领用明细')
  }
  if (formData.value.items.some((item) => !item.applyQuantity || item.applyQuantity < 1)) {
    return message.warning('请填写每行领用数量，数量不能小于 1')
  }

  // 2. 保存申请
  formLoading.value = true
  try {
    // 保存成功后记录申请编号
    if (formData.value.id) {
      await SupplyApplyApi.updateSupplyApply(formData.value)
    } else {
      formData.value.id = await SupplyApplyApi.createSupplyApply(formData.value)
    }
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    applyTime: formatDate(new Date(), 'YYYY-MM-DD 00:00:00'),
    useType: 1,
    pickupMethod: 1,
    items: [],
    fileUrls: []
  }
  formRef.value?.resetFields()
}
</script>
