<!-- TODO @AI：一行 3 个； -->
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
        <el-col :span="8">
          <el-form-item label="启用" prop="enableFlag">
            <el-switch v-model="formData.enableFlag" :disabled="isReadonly" />
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

    <el-divider content-position="center">盘点参数</el-divider>
    <!-- TODO @AI：类似别的模块，不用放在 components 里；类似 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/salesnotice/SalesNoticeForm.vue -->
    <StockTakingParamTable v-model="formData.params" :disabled="isReadonly" />

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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { StockTakingPlanApi, type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan'
import StockTakingParamTable from './components/StockTakingParamTable.vue'

// TODO @AI：注释风格，参考：/Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/salesnotice/SalesNoticeForm.vue

defineOptions({ name: 'StockTakingPlanForm' })

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref('create')
const formRef = ref()
const formData = ref<StockTakingPlanVO>({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  startTime: undefined,
  endTime: undefined,
  blindFlag: false,
  frozenFlag: false,
  enableFlag: true,
  remark: undefined,
  params: []
})

const formRules = reactive({
  code: [{ required: true, message: '方案编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '盘点类型不能为空', trigger: 'change' }]
})

const isReadonly = computed(() => formType.value === 'detail')
const dialogTitle = computed(() => {
  const titles = {
    create: '新增盘点方案',
    update: '编辑盘点方案',
    detail: '盘点方案详情'
  }
  return titles[formType.value] || formType.value
})

const generateCode = () => {
  formData.value.code = 'STP' + generateRandomStr(10)
}

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
    enableFlag: true,
    remark: undefined,
    params: []
  }
  formRef.value?.resetFields()
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = await StockTakingPlanApi.getStockTakingPlan(id)
      formData.value = {
        ...data,
        params: data.params || []
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    // TODO @AI:这里看着过于复杂，看看怎么简化下；
    const data = {
      ...formData.value,
      params: (formData.value.params || []).filter(
        (item) => item.type && item.valueId !== undefined && item.valueId !== ''
      )
    } as StockTakingPlanVO
    if (formType.value === 'create') {
      const id = await StockTakingPlanApi.createStockTakingPlan(data)
      message.success('新增成功')
      formData.value.id = id
      formType.value = 'update'
    } else {
      await StockTakingPlanApi.updateStockTakingPlan(data)
      message.success('修改成功')
    }
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
