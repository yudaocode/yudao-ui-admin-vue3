<!-- DONE @AI：当前基础信息区已按 1 行 3 列布局展示，时间字段保留 12 栅格以兼容日期时间选择器。 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1100px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="方案编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入方案编码" :disabled="isReadonly">
              <template #append>
                <el-button @click="generateCode" :disabled="formType !== 'create'">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="方案名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入方案名称" :disabled="isReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盘点类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择盘点类型"
              class="!w-full"
              :disabled="isReadonly"
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
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择开始时间"
              class="!w-full"
              :disabled="isReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择结束时间"
              class="!w-full"
              :disabled="isReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否盲盘" prop="blindFlag">
            <el-switch v-model="formData.blindFlag" :disabled="isReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="冻结库存" prop="frozenFlag">
            <el-switch v-model="formData.frozenFlag" :disabled="isReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 编辑时展示盘点参数 -->
    <template v-if="formType === 'update' && formData.id">
      <el-divider content-position="center">盘点参数</el-divider>
      <StockTakingParamTable :plan-id="formData.id" />
    </template>

    <template #footer>
      <el-button v-if="!isReadonly" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { StockTakingPlanApi, type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan/index'
import {
  StockTakingPlanParamApi,
  type StockTakingPlanParamVO
} from '@/api/mes/wm/stocktaking/plan/param/index'
import StockTakingParamTable from './components/StockTakingParamTable.vue'

defineOptions({ name: 'StockTakingPlanForm' })

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改；detail - 详情
const formRef = ref() // 表单 Ref
const paramList = ref<StockTakingPlanParamVO[]>([]) // 新建方案时的本地参数列表
const formData = ref<StockTakingPlanVO>({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  startTime: undefined,
  endTime: undefined,
  blindFlag: false,
  frozenFlag: false,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '方案编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '盘点类型不能为空', trigger: 'change' }]
})

const isReadonly = computed(() => formType.value === 'detail') // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增盘点方案',
    update: '编辑盘点方案',
    detail: '盘点方案详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成方案编码 */
const generateCode = () => {
  formData.value.code = 'STP' + generateRandomStr(10)
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    type: undefined,
    startTime: undefined,
    endTime: undefined,
    blindFlag: false,
    frozenFlag: false,
    remark: undefined
  }
  paramList.value = []
  formRef.value?.resetFields()
}

const buildValidParams = () => {
  return paramList.value.filter(
    (item) => item.type && item.valueId !== undefined && item.valueId !== ''
  )
}

const syncPlanParams = async (planId: number) => {
  const currentParams = buildValidParams()
  if (currentParams.length === 0) {
    return
  }
  await Promise.all(
    currentParams.map((item) =>
      StockTakingPlanParamApi.createStockTakingPlanParam({
        ...item,
        planId,
        valueId: Number(item.valueId)
      })
    )
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockTakingPlanApi.getStockTakingPlan(id)
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
    let planId = formData.value.id
    if (formType.value === 'create') {
      planId = await StockTakingPlanApi.createStockTakingPlan(formData.value)
      message.success('新增成功')
    } else {
      await StockTakingPlanApi.updateStockTakingPlan(formData.value)
      planId = formData.value.id
      message.success('修改成功')
    }
    if (formType.value === 'create') {
      formData.value.id = planId
      await syncPlanParams(planId!)
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
