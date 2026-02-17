<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="计划编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入计划编码">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计划名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入计划名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="班组类型" prop="calendarType">
            <el-select v-model="formData.calendarType" placeholder="请选择班组类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker
              v-model="formData.startDate"
              type="date"
              value-format="x"
              placeholder="请选择开始日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker
              v-model="formData.endDate"
              type="date"
              value-format="x"
              placeholder="请选择结束日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="轮班方式" prop="shiftType">
            <el-select v-model="formData.shiftType" placeholder="请选择轮班方式" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_SHIFT_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8" v-if="formData.shiftType && formData.shiftType !== MesCalShiftTypeEnum.SINGLE">
          <el-form-item label="倒班方式" prop="shiftMethod">
            <el-select v-model="formData.shiftMethod" placeholder="请选择倒班方式" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_SHIFT_METHOD)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.shiftMethod === MesCalShiftMethodEnum.DAY">
          <el-form-item label="倒班天数" prop="shiftCount">
            <el-input-number
              v-model="formData.shiftCount"
              :min="1"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <dict-tag :type="DICT_TYPE.MES_CAL_PLAN_STATUS" :value="formData.status" />
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
    <!-- 编辑时显示子资源 Tab -->
    <el-tabs v-if="formType === 'update'" v-model="activeTab" class="mt-10px">
      <el-tab-pane label="班次" name="shift">
        <CalShiftPanel :plan-id="formData.id!" />
      </el-tab-pane>
      <el-tab-pane label="班组" name="team">
        <CalPlanTeamPanel :plan-id="formData.id!" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <!-- 确认按钮：仅草稿状态显示 -->
      <el-button
        v-if="formType === 'update' && formData.status === MesCalPlanStatusEnum.PREPARE"
        type="warning"
        @click="handleConfirm"
        :disabled="formLoading"
      >
        确认计划
      </el-button>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CalPlanApi, CalPlanVO } from '@/api/mes/cal/plan'
import { generateRandomStr } from '@/utils'
import { MesCalPlanStatusEnum, MesCalShiftTypeEnum, MesCalShiftMethodEnum } from '@/views/mes/utils/constants'
import CalShiftPanel from './CalShiftPanel.vue'
import CalPlanTeamPanel from './CalPlanTeamPanel.vue'

defineOptions({ name: 'CalPlanForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const activeTab = ref('shift') // 当前激活的资源 Tab
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  calendarType: undefined,
  startDate: undefined,
  endDate: undefined,
  shiftType: undefined,
  shiftMethod: undefined,
  shiftCount: undefined,
  status: MesCalPlanStatusEnum.PREPARE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '计划编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '计划名称不能为空', trigger: 'blur' }],
  startDate: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  endDate: [{ required: true, message: '结束日期不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 生成计划编码 */
const generateCode = () => {
  formData.value.code = 'PLAN' + generateRandomStr(8)
}

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
      formData.value = await CalPlanApi.getPlan(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as CalPlanVO
    if (formType.value === 'create') {
      await CalPlanApi.createPlan(data)
      message.success(t('common.createSuccess'))
    } else {
      await CalPlanApi.updatePlan(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 确认计划 */
const handleConfirm = async () => {
  try {
    await message.confirm('确认该排班计划？确认后将不可修改或删除。')
    formLoading.value = true
    await CalPlanApi.confirmPlan(formData.value.id!)
    message.success('确认成功')
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
    calendarType: undefined,
    startDate: undefined,
    endDate: undefined,
    shiftType: undefined,
    shiftMethod: undefined,
    shiftCount: undefined,
    status: MesCalPlanStatusEnum.PREPARE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
