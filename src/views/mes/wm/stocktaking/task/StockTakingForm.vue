<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="任务编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入任务编码" :disabled="isDetail">
              <template #append>
                <el-button @click="generateCode">生成</el-button>
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
        <el-col :span="8" v-if="formData.type === MesWmStockTakingTypeEnum.DYNAMIC">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              value-format="x"
              placeholder="请选择开始时间"
              class="!w-full"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.type === MesWmStockTakingTypeEnum.DYNAMIC">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              value-format="x"
              placeholder="请选择结束时间"
              class="!w-full"
              :disabled="isDetail"
            />
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
          <el-form-item label="是否冻结库存" prop="frozen">
            <el-switch v-model="formData.frozen" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盘点人" prop="userId">
            <UserSelectV2 v-model="formData.userId" :disabled="isDetail" />
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

    <el-tabs v-if="formData.id" v-model="activeTab" type="border-card" class="mt-16px">
      <el-tab-pane v-if="!formData.blindFlag" label="盘点清单" name="lines">
        <StockTakingTaskLineList :task-id="formData.id" :form-type="formType" />
      </el-tab-pane>
      <el-tab-pane v-if="resultVisible || isExecute" label="盘点结果" name="results">
        <StockTakingTaskResultList
          ref="resultListRef"
          :task-id="formData.id"
          :form-type="isExecute ? 'execute' : 'detail'"
        />
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmStockTakingTaskStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isSubmit" @click="handleSubmit" type="warning" :disabled="formLoading">
        提 交
      </el-button>
      <el-button v-if="isExecute" @click="handleExecute" type="primary" :disabled="formLoading">
        执行盘点
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { StockTakingApi, type StockTakingTaskVO } from '@/api/mes/wm/stocktaking/task/index'
import { type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan/index'
import StockTakingPlanSelect from '@/views/mes/wm/stocktaking/plan/components/StockTakingPlanSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import StockTakingTaskLineList from './StockTakingTaskLineList.vue'
import StockTakingTaskResultList from './StockTakingTaskResultList.vue'
import {
  MesAutoCodeRuleCode,
  MesWmStockTakingTypeEnum,
  MesWmStockTakingTaskStatusEnum
} from '@/views/mes/utils/constants'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'StockTakingForm' })

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref<string>('create') // 表单的类型：create / update / submit / execute / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isSubmit = computed(() => formType.value === 'submit') // 是否为提交模式
const isExecute = computed(() => formType.value === 'execute') // 是否为执行盘点模式
const isDetail = computed(() => ['detail', 'submit', 'execute'].includes(formType.value)) // 是否只读
const isHeaderReadonly = computed(() => ['submit', 'execute', 'detail'].includes(formType.value)) // 头部是否只读
const resultVisible = computed(
  () => formData.value.status && formData.value.status !== MesWmStockTakingTaskStatusEnum.PREPARE
)
const dialogTitle = computed(() => {
  const titles = {
    create: '新增盘点任务',
    update: '编辑盘点任务',
    submit: '提交盘点任务',
    execute: '执行盘点',
    detail: '盘点任务详情'
  }
  return titles[formType.value] || formType.value
}) // 弹窗的标题
const formData = ref<StockTakingTaskVO>({
  id: undefined,
  code: undefined,
  name: undefined,
  takingDate: undefined,
  type: undefined,
  status: undefined,
  userId: undefined,
  userNickname: undefined,
  planId: undefined,
  startTime: undefined,
  endTime: undefined,
  blindFlag: false,
  frozen: false,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '任务编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  planId: [{ required: true, message: '盘点方案不能为空', trigger: 'change' }],
  type: [{ required: true, message: '盘点类型不能为空', trigger: 'change' }],
  takingDate: [{ required: true, message: '盘点日期不能为空', trigger: 'change' }],
  blindFlag: [{ required: true, message: '是否盲盘不能为空', trigger: 'change' }],
  frozen: [{ required: true, message: '是否冻结库存不能为空', trigger: 'change' }],
  userId: [{ required: true, message: '盘点人不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const activeTab = ref('lines') // 当前激活的 tab
const resultListRef = ref() // 盘点结果列表 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成任务编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_STOCK_TAKING_CODE
  )
}

/** 方案变化处理 */
const handlePlanChange = (plan?: StockTakingPlanVO) => {
  if (!plan) {
    return
  }
  formData.value.name = plan.name
  formData.value.type = plan.type
  formData.value.startTime = plan.startTime
  formData.value.endTime = plan.endTime
  formData.value.blindFlag = !!plan.blindFlag
  formData.value.frozen = !!plan.frozen
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = type === 'execute' ? 'results' : 'lines'
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockTakingApi.getStockTaking(id)
    } finally {
      formLoading.value = false
    }
  } else {
    // 新建时，默认设置当前登录用户为盘点人
    formData.value.userId = useUserStore().getUser.id
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as StockTakingTaskVO
    if (formType.value === 'create') {
      const res = await StockTakingApi.createStockTaking(data)
      message.success(t('common.createSuccess'))
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmStockTakingTaskStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await StockTakingApi.updateStockTaking(data)
      message.success(t('common.updateSuccess'))
    }
    // 更新快照
    originalFormData.value = JSON.stringify(formData.value)
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：表单修改过则先保存，再提交 */
const handleSubmit = async () => {
  try {
    await message.confirm('确认提交该盘点任务？【提交后将不能修改】')
    formLoading.value = true
    // 1. 编辑模式下，表单有修改时先保存
    if (isEditable.value && JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as StockTakingTaskVO
      await StockTakingApi.updateStockTaking(data)
    }
    // 2. 提交任务
    await StockTakingApi.submitStockTaking(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行盘点 */
const handleExecute = async () => {
  try {
    await message.confirm('确认执行盘点操作？')
    formLoading.value = true
    await StockTakingApi.finishStockTaking(formData.value.id!)
    message.success('执行盘点成功')
    dialogVisible.value = false
    emit('success')
  } catch {
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
    status: undefined,
    userId: undefined,
    userNickname: undefined,
    planId: undefined,
    startTime: undefined,
    endTime: undefined,
    blindFlag: false,
    frozen: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
