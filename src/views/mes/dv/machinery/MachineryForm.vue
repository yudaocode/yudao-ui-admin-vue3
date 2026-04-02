<!-- MES 设备台账表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="设备编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入设备编码">
              <template #append>
                <el-button @click="generateCode" :disabled="formType !== 'create'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="设备名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入设备名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="品牌" prop="brand">
            <el-input v-model="formData.brand" placeholder="请输入品牌" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="设备类型" prop="machineryTypeId">
            <DvMachineryTypeSelect v-model="formData.machineryTypeId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="所属车间" prop="workshopId">
            <MdWorkshopSelect v-model="formData.workshopId" placeholder="请选择所属车间" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="设备状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_MACHINERY_STATUS)"
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
          <el-form-item label="规格型号" prop="spec">
            <el-input v-model="formData.spec" placeholder="请输入规格型号" />
          </el-form-item>
        </el-col>
        <el-col v-if="isDetail" :span="8">
          <el-form-item label="最近点检时间" prop="lastCheckTime">
            <el-date-picker
              v-model="formData.lastCheckTime"
              type="datetime"
              value-format="x"
              class="!w-1/1"
              disabled
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isDetail" :span="8">
          <el-form-item label="最近保养时间" prop="lastMaintenTime">
            <el-date-picker
              v-model="formData.lastMaintenTime"
              type="datetime"
              value-format="x"
              class="!w-1/1"
              disabled
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 编辑/详情时显示子资源 Tab -->
    <el-tabs v-if="formType !== 'create' && formData.id" v-model="activeTab" class="mt-10px">
      <el-tab-pane label="点检记录" name="check" lazy>
        <MachineryCheckRecordList :machinery-id="formData.id" />
      </el-tab-pane>
      <el-tab-pane label="保养记录" name="mainten" lazy>
        <MachineryMaintenRecordList :machinery-id="formData.id" />
      </el-tab-pane>
      <el-tab-pane label="维修记录" name="repair" lazy>
        <MachineryRepairList :machinery-id="formData.id" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading"
        >确 定</el-button
      >
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { DvMachineryApi, DvMachineryVO } from '@/api/mes/dv/machinery'
import MdWorkshopSelect from '@/views/mes/md/workstation/components/MdWorkshopSelect.vue'
import DvMachineryTypeSelect from '@/views/mes/dv/machinery/type/components/DvMachineryTypeSelect.vue'
import MachineryCheckRecordList from './MachineryCheckRecordList.vue'
import MachineryMaintenRecordList from './MachineryMaintenRecordList.vue'
import MachineryRepairList from './MachineryRepairList.vue'
import { MesDvMachineryStatusEnum, MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'

defineOptions({ name: 'MachineryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail')
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增设备',
    update: '修改设备',
    detail: '查看设备'
  }
  return titles[formType.value] || formType.value
})
const activeTab = ref('check') // 当前激活的资源 Tab
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  brand: undefined,
  spec: undefined,
  machineryTypeId: undefined,
  workshopId: undefined,
  status: MesDvMachineryStatusEnum.STOP,
  lastCheckTime: undefined,
  lastMaintenTime: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
  machineryTypeId: [{ required: true, message: '设备类型不能为空', trigger: 'change' }],
  workshopId: [{ required: true, message: '所属车间不能为空', trigger: 'change' }],
  status: [{ required: true, message: '设备状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成设备编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.DV_MACHINERY_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DvMachineryApi.getMachinery(id)
    } finally {
      formLoading.value = false
    }
    activeTab.value = 'check'
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DvMachineryVO
    if (formType.value === 'create') {
      await DvMachineryApi.createMachinery(data)
      message.success(t('common.createSuccess'))
    } else {
      await DvMachineryApi.updateMachinery(data)
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
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    brand: undefined,
    spec: undefined,
    machineryTypeId: undefined,
    workshopId: undefined,
    status: MesDvMachineryStatusEnum.STOP,
    lastCheckTime: undefined,
    lastMaintenTime: undefined,
    remark: undefined
  }

  formRef.value?.resetFields()
  activeTab.value = 'check'
}
</script>
