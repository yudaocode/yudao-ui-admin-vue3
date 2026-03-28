<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="工作站编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入工作站编码">
              <template #append>
                <el-button @click="generateCode">
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
            <MdWorkshopSelect v-model="formData.workshopId" placeholder="请选择车间" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="工作站地点" prop="address">
            <el-input v-model="formData.address" placeholder="请输入工作站地点" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="所属工序" prop="processId">
            <ProProcessSelect
              v-model="formData.processId"
              placeholder="请选择所属工序"
              clearable
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              clearable
              @change="handleWarehouseSelectChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="库区" prop="locationId">
            <el-select
              v-model="formData.locationId"
              placeholder="请选择库区"
              clearable
              class="!w-1/1"
              :disabled="!formData.warehouseId"
              @change="handleLocationChange"
            >
              <el-option
                v-for="location in locationList"
                :key="location.id"
                :label="location.name"
                :value="location.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库位" prop="areaId">
            <el-select
              v-model="formData.areaId"
              placeholder="请选择库位"
              clearable
              class="!w-1/1"
              :disabled="!formData.locationId"
            >
              <el-option
                v-for="area in areaList"
                :key="area.id"
                :label="area.name"
                :value="area.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
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
    <el-tabs v-if="formType !== 'create'" v-model="activeTab" class="mt-10px">
      <el-tab-pane label="设备资源" name="machine">
        <WorkstationMachineList :workstation-id="formData.id!" :formType="formType" />
      </el-tab-pane>
      <el-tab-pane label="工装夹具" name="tool">
        <WorkstationToolList :workstation-id="formData.id!" :formType="formType" />
      </el-tab-pane>
      <el-tab-pane label="人力资源" name="worker">
        <WorkstationWorkerList :workstation-id="formData.id!" :formType="formType" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!isDetail">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdWorkstationApi, MdWorkstationVO } from '@/api/mes/md/workstation'
import MdWorkshopSelect from '@/views/mes/md/workstation/components/MdWorkshopSelect.vue'
import ProProcessSelect from '@/views/mes/pro/process/components/ProProcessSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { WmWarehouseAreaApi, WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import { CommonStatusEnum } from '@/utils/constants'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import WorkstationMachineList from './WorkstationMachineList.vue'
import WorkstationToolList from './WorkstationToolList.vue'
import WorkstationWorkerList from './WorkstationWorkerList.vue'

defineOptions({ name: 'WorkstationForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail')
const activeTab = ref('machine') // 当前激活的资源 Tab
const locationList = ref<WmWarehouseLocationVO[]>([]) // 库区下拉列表
const areaList = ref<WmWarehouseAreaVO[]>([]) // 库位下拉列表
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
}) // 表单数据
const formRules = reactive({
  code: [{ required: true, message: '工作站编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工作站名称不能为空', trigger: 'blur' }],
  workshopId: [{ required: true, message: '所在车间不能为空', trigger: 'change' }],
  processId: [{ required: true, message: '所属工序不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref

/** 生成工作站编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.MD_WORKSTATION_CODE
  )
}

/** 加载库区列表 */
const loadLocationList = async (warehouseId?: number) => {
  if (!warehouseId) {
    locationList.value = []
    return
  }
  locationList.value = await WmWarehouseLocationApi.getWarehouseLocationSimpleList(warehouseId)
}

/** 加载库位列表 */
const loadAreaList = async (locationId?: number) => {
  if (!locationId) {
    areaList.value = []
    return
  }
  areaList.value = await WmWarehouseAreaApi.getWarehouseAreaSimpleList(locationId)
}

/** 仓库选择变化：重置库区和库位 */
const handleWarehouseSelectChange = async (item: WmWarehouseVO | undefined) => {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
  areaList.value = []
  await loadLocationList(item?.id)
}

/** 库区改变时，重置库位 */
const handleLocationChange = async (locationId?: number) => {
  formData.value.areaId = undefined
  await loadAreaList(locationId)
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
      formData.value = await MdWorkstationApi.getWorkstation(id)
      // 加载库区和库位列表（因为修改时会回显仓库和库区，所以需要加载对应的列表）
      await loadLocationList(formData.value.warehouseId)
      await loadAreaList(formData.value.locationId)
    } finally {
      formLoading.value = false
    }
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
    const data = formData.value as unknown as MdWorkstationVO
    if (formType.value === 'create') {
      await MdWorkstationApi.createWorkstation(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdWorkstationApi.updateWorkstation(data)
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
    address: undefined,
    workshopId: undefined,
    processId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  locationList.value = []
  areaList.value = []
  formRef.value?.resetFields()
}
</script>
