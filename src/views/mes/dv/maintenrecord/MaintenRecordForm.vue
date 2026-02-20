<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <!-- TODO @AI：设备 select；不用 设备名称、品牌、规格型号 -->
          <el-form-item label="设备" prop="machineryId">
            <el-select
              v-model="formData.machineryId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入设备名称或编码搜索"
              :remote-method="getMachineryOptions"
              @change="handleMachineryChange"
            >
              <el-option
                v-for="item in machineryOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="设备名称">
            <el-input v-model="machineryInfo.name" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="品牌">
            <el-input v-model="machineryInfo.brand" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="规格型号">
            <el-input v-model="machineryInfo.spec" disabled type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="8">
          <!-- TODO @AI：使用包养计划的 select 组件 -->
          <el-form-item label="保养计划" prop="planId">
            <el-select
              v-model="formData.planId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入计划名称搜索"
              :remote-method="getPlanOptions"
            >
              <el-option
                v-for="item in planOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- TODO @AI：保养人的 select -->
          <el-form-item label="保养人" prop="userId">
            <el-select
              v-model="formData.userId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入保养人搜索"
              :remote-method="getUserOptions"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="保养时间" prop="maintenTime">
            <el-date-picker
              v-model="formData.maintenTime"
              type="datetime"
              value-format="x"
              placeholder="选择保养时间"
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

    <template v-if="formData.id">
      <el-divider content-position="center">保养项目明细</el-divider>
      <MaintenRecordLineList :record-id="formData.id" />
    </template>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :disabled="formLoading">确 定</el-button>
      <!-- TODO @AI：提交挪到 index.vue 外面； -->
      <el-button
        type="success"
        @click="handleFinish"
        v-if="formData.id && formData.status === 10"
        :disabled="formLoading"
        >提 交</el-button
      >
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DvMaintenRecordApi } from '@/api/mes/dv/maintenrecord'
import { DvMachineryApi } from '@/api/mes/dv/machinery'
import * as UserApi from '@/api/system/user'
import request from '@/config/axios'
import MaintenRecordLineList from './components/MaintenRecordLineList.vue'

// TODO @AI：注释风格，参考别的 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/UserForm.vue

defineOptions({ name: 'MaintenRecordForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  planId: undefined,
  machineryId: undefined,
  maintenTime: undefined,
  userId: undefined,
  status: 10,
  remark: ''
})
const formRules = reactive({
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
  maintenTime: [{ required: true, message: '保养时间不能为空', trigger: 'blur' }]
})
const formRef = ref()

const machineryOptions = ref<any[]>([])
const planOptions = ref<any[]>([])
const userOptions = ref<any[]>([])

const machineryInfo = reactive({
  name: '',
  brand: '',
  spec: ''
})

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
      formData.value = await DvMaintenRecordApi.getMaintenRecord(id)
      // 加载设备选项以显示名称
      if (formData.value.machineryId) {
        const machinery = await DvMachineryApi.getMachinery(formData.value.machineryId)
        if (machinery) {
          machineryOptions.value = [machinery]
          handleMachineryChange(machinery.id)
        }
      }
      // TODO @芋艿：待 DvCheckPlanApi 就绪后，替换为 DvCheckPlanApi.getCheckPlan()
      if (formData.value.planId) {
        const plan = await request.get({
          url: `/mes/dv/check-plan/get?id=${formData.value.planId}`
        })
        if (plan) planOptions.value = [plan]
      }
      if (formData.value.userId) {
        const user = await UserApi.getUser(formData.value.userId)
        if (user) userOptions.value = [user]
      }
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
    const data = formData.value as any
    if (formType.value === 'create') {
      await DvMaintenRecordApi.createMaintenRecord(data)
      message.success(t('common.createSuccess'))
    } else {
      await DvMaintenRecordApi.updateMaintenRecord(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 提交按钮（完成保养） */
const handleFinish = async () => {
  if (formData.value.id && formData.value.status === 10) {
    formLoading.value = true
    try {
      formData.value.status = 20
      await DvMaintenRecordApi.updateMaintenRecord(formData.value as any)
      message.success('已提交保养完成')
      dialogVisible.value = false
      emit('success')
    } catch {
      formData.value.status = 10
    } finally {
      formLoading.value = false
    }
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    planId: undefined,
    machineryId: undefined,
    maintenTime: undefined,
    userId: undefined,
    status: 10,
    remark: ''
  }
  machineryInfo.name = ''
  machineryInfo.brand = ''
  machineryInfo.spec = ''
  formRef.value?.resetFields()
}

/** 获取设备选项 */
const getMachineryOptions = async (query: string) => {
  const data = await DvMachineryApi.getMachineryPage({ name: query, pageNo: 1, pageSize: 20 })
  machineryOptions.value = data.list
}

/** 处理设备变化 */
const handleMachineryChange = async (val: number) => {
  const selected = machineryOptions.value.find((item) => item.id === val)
  if (selected) {
    machineryInfo.name = selected.name
    machineryInfo.brand = selected.brand
    machineryInfo.spec = selected.spec
  }
}

/** 获取计划选项 */
// TODO @芋艿：待 DvCheckPlanApi 就绪后，替换为 DvCheckPlanApi.getCheckPlanPage()
const getPlanOptions = async (query: string) => {
  try {
    const data = await request.get({
      url: `/mes/dv/check-plan/page`,
      params: { name: query, pageNo: 1, pageSize: 20 }
    })
    planOptions.value = data.list
  } catch {}
}

/** 获取用户选项 */
const getUserOptions = async (query: string) => {
  try {
    const data = await UserApi.getUserPage({ nickname: query, pageNo: 1, pageSize: 20 })
    userOptions.value = data.list
  } catch {}
}
</script>
