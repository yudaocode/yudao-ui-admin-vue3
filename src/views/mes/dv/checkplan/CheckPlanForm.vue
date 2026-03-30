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
          <el-form-item label="方案编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入方案编码">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="方案名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入方案名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="方案类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择方案类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE)"
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
          <el-form-item label="周期数量" prop="cycleCount">
            <el-input-number
              v-model="formData.cycleCount"
              :min="1"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="周期类型" prop="cycleType">
            <el-select v-model="formData.cycleType" placeholder="请选择周期类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_CYCLE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <dict-tag :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="formData.status" />
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
      <el-tab-pane label="设备清单" name="machinery">
        <CheckPlanMachineryList :plan-id="formData.id!" />
      </el-tab-pane>
      <el-tab-pane label="点检保养项目" name="subject">
        <CheckPlanSubjectList :plan-id="formData.id!" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { DvCheckPlanApi, DvCheckPlanVO } from '@/api/mes/dv/checkplan'
import { generateRandomStr } from '@/utils'
import { MesDvCheckPlanStatusEnum } from '@/views/mes/utils/constants'
import CheckPlanMachineryList from './CheckPlanMachineryList.vue'
import CheckPlanSubjectList from './CheckPlanSubjectList.vue'

defineOptions({ name: 'CheckPlanForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const activeTab = ref('machinery') // 当前激活的资源 Tab
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  startDate: undefined,
  endDate: undefined,
  cycleType: undefined,
  cycleCount: undefined,
  status: MesDvCheckPlanStatusEnum.PREPARE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '方案编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '方案类型不能为空', trigger: 'change' }],
  cycleType: [{ required: true, message: '周期类型不能为空', trigger: 'change' }],
  cycleCount: [{ required: true, message: '周期数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 生成方案编码 */
const generateCode = () => {
  formData.value.code = 'CHP' + generateRandomStr(8)
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
      formData.value = await DvCheckPlanApi.getCheckPlan(id)
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
    const data = formData.value as unknown as DvCheckPlanVO
    if (formType.value === 'create') {
      await DvCheckPlanApi.createCheckPlan(data)
      message.success(t('common.createSuccess'))
    } else {
      await DvCheckPlanApi.updateCheckPlan(data)
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
    code: undefined,
    name: undefined,
    type: undefined,
    startDate: undefined,
    endDate: undefined,
    cycleType: undefined,
    cycleCount: undefined,
    status: MesDvCheckPlanStatusEnum.PREPARE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
