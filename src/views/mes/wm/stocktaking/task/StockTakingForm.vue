<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="任务编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入任务编码" :disabled="isDetail">
              <template #append>
                <el-button @click="generateCode" :disabled="formType !== 'create'">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="任务名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入任务名称" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盘点方案" prop="planId">
            <StockTakingPlanSelect
              v-model="formData.planId"
              :disabled="isDetail"
              @change="handlePlanChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盘点类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择盘点类型"
              class="!w-full"
              :disabled="isDetail"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盘点日期" prop="takingDate">
            <el-date-picker
              v-model="formData.takingDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择盘点日期"
              class="!w-full"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否盲盘" prop="blindFlag">
            <el-switch v-model="formData.blindFlag" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否冻结库存" prop="frozenFlag">
            <el-switch v-model="formData.frozenFlag" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盘点人" prop="userId">
            <UserSelect v-model="formData.userId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
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
    </el-form>

    <template #footer>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { StockTakingApi, type StockTakingTaskVO } from '@/api/mes/wm/stocktaking/task/index'
import { type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan/index'
import StockTakingPlanSelect from '@/views/mes/wm/stocktaking/plan/components/StockTakingPlanSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'

defineOptions({ name: 'StockTakingForm' })

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = computed(() => {
  const titles = {
    create: '新增盘点任务',
    update: '编辑盘点任务',
    detail: '盘点任务详情'
  }
  return titles[formType.value] || formType.value
}) // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否只读
const formRef = ref() // 表单 Ref
const formData = ref<StockTakingTaskVO>({
  id: undefined,
  code: undefined,
  name: undefined,
  takingDate: undefined,
  type: undefined,
  userId: undefined,
  userNickname: undefined,
  planId: undefined,
  blindFlag: false,
  frozenFlag: false,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '任务编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '盘点类型不能为空', trigger: 'change' }],
  takingDate: [{ required: true, message: '盘点日期不能为空', trigger: 'change' }],
  blindFlag: [{ required: true, message: '是否盲盘不能为空', trigger: 'change' }],
  frozenFlag: [{ required: true, message: '是否冻结库存不能为空', trigger: 'change' }],
  userId: [{ required: true, message: '盘点人不能为空', trigger: 'change' }]
})

/** 生成任务编码 */
const generateCode = () => {
  formData.value.code = 'ST' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockTakingApi.getStockTaking(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as StockTakingTaskVO
    if (formType.value === 'create') {
      await StockTakingApi.createStockTaking(data)
      message.success(t('common.createSuccess'))
      dialogVisible.value = false
    } else {
      await StockTakingApi.updateStockTaking(data)
      message.success(t('common.updateSuccess'))
      dialogVisible.value = false
    }
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
    takingDate: undefined,
    type: undefined,
    userId: undefined,
    userNickname: undefined,
    planId: undefined,
    blindFlag: false,
    frozenFlag: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 方案变化处理 */
const handlePlanChange = (plan?: StockTakingPlanVO) => {
  if (!plan) {
    return
  }
  formData.value.type = plan.type
  formData.value.blindFlag = !!plan.blindFlag
  formData.value.frozenFlag = !!plan.frozenFlag
}
</script>
