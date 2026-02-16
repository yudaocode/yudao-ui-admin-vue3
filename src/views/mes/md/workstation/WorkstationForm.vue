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
          <el-form-item label="工作站编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入工作站编码">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工作站名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="所在车间" prop="workshopId">
            <el-select v-model="formData.workshopId" placeholder="请选择车间" class="!w-1/1">
              <el-option
                v-for="workshop in workshopList"
                :key="workshop.id"
                :label="workshop.name"
                :value="workshop.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="工作站地点" prop="address">
            <el-input v-model="formData.address" placeholder="请输入工作站地点" />
          </el-form-item>
        </el-col>
        <!-- TODO @AI：所属工序 -->
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
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
      <el-tab-pane label="设备资源" name="machine">
        <WorkstationMachinePanel :workstation-id="formData.id!" />
      </el-tab-pane>
      <el-tab-pane label="工装夹具" name="tool">
        <WorkstationToolPanel :workstation-id="formData.id!" />
      </el-tab-pane>
      <el-tab-pane label="人力资源" name="worker">
        <WorkstationWorkerPanel :workstation-id="formData.id!" />
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
import { MdWorkstationApi, MdWorkstationVO } from '@/api/mes/md/workstation'
import { MdWorkshopApi, MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import { CommonStatusEnum } from '@/utils/constants'
import { generateRandomStr } from '@/utils'
import WorkstationMachinePanel from './components/WorkstationMachinePanel.vue'
import WorkstationToolPanel from './components/WorkstationToolPanel.vue'
import WorkstationWorkerPanel from './components/WorkstationWorkerPanel.vue'

// TODO @AI：方法注释；
// TODO @AI：字段注释；

defineOptions({ name: 'WorkstationForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const activeTab = ref('machine')
const workshopList = ref<MdWorkshopVO[]>([]) // 车间列表
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  address: undefined,
  workshopId: undefined,
  processId: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '工作站编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工作站名称不能为空', trigger: 'blur' }],
  workshopId: [{ required: true, message: '所在车间不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 生成工作站编码 */
const generateCode = () => {
  formData.value.code = 'WS' + generateRandomStr(12)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载车间列表
  workshopList.value = await MdWorkshopApi.getWorkshopSimpleList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MdWorkstationApi.getWorkstation(id)
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
    const data = formData.value as unknown as MdWorkstationVO
    if (formType.value === 'create') {
      await MdWorkstationApi.createWorkstation(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdWorkstationApi.updateWorkstation(data)
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
    address: undefined,
    workshopId: undefined,
    processId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
