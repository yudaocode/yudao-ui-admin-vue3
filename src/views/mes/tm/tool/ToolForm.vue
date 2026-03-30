<!-- MES 工具台账表单 -->
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
        <el-col :span="12">
          <el-form-item label="工具编码" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入工具编码"
              :disabled="formType !== 'create'"
            >
              <template v-if="formType === 'create'" #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工具名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工具名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="工具类型" prop="toolTypeId">
            <TmToolTypeSelect
              v-model="formData.toolTypeId"
              placeholder="请选择工具类型"
              @change="handleToolTypeChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="品牌" prop="brand">
            <el-input v-model="formData.brand" placeholder="请输入品牌" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="型号规格" prop="spec">
            <el-input v-model="formData.spec" placeholder="请输入型号规格" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="库存数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="1"
              :disabled="selectedToolType?.codeFlag === true"
              class="!w-1/1"
              @change="handleQuantityChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="可用数量" prop="availableQuantity">
            <el-input-number
              v-model="formData.availableQuantity"
              :min="0"
              disabled
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" disabled class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_TOOL_STATUS)"
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
          <el-form-item label="保养维护类型" prop="maintenType">
            <el-select
              v-model="formData.maintenType"
              placeholder="请选择保养维护类型"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_MAINTEN_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.maintenType === MesMaintenTypeEnum.REGULAR">
          <el-form-item label="下次保养日期" prop="nextMaintenDate">
            <el-date-picker
              v-model="formData.nextMaintenDate"
              type="datetime"
              placeholder="请选择下次保养日期"
              value-format="x"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.maintenType === MesMaintenTypeEnum.USAGE">
          <el-form-item label="下次保养周期" prop="nextMaintenPeriod">
            <el-input-number
              v-model="formData.nextMaintenPeriod"
              :min="1"
              placeholder="次数"
              class="!w-1/1"
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
    <!-- TODO @AI：条码相关，先忽略，后续加 -->
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
import { TmToolApi, TmToolVO } from '@/api/mes/tm/tool'
import { TmToolTypeVO } from '@/api/mes/tm/tool/type'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import TmToolTypeSelect from '@/views/mes/tm/tool/components/TmToolTypeSelect.vue'
import {
  MesToolStatusEnum,
  MesMaintenTypeEnum,
  MesAutoCodeRuleCode
} from '@/views/mes/utils/constants'

defineOptions({ name: 'ToolForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增工具',
    update: '修改工具',
    detail: '查看工具'
  }
  return titles[formType.value] || formType.value
})
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  brand: undefined,
  spec: undefined,
  toolTypeId: undefined,
  quantity: 1,
  availableQuantity: 1,
  maintenType: undefined,
  nextMaintenPeriod: undefined,
  nextMaintenDate: undefined,
  status: MesToolStatusEnum.STORE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '工具编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工具名称不能为空', trigger: 'blur' }],
  toolTypeId: [{ required: true, message: '工具类型不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const selectedToolType = ref<TmToolTypeVO>() // 当前选中的工具类型

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await TmToolApi.getTool(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 生成工具编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_CODE)
}

/** 库存数量变更：新增时联动同步可用数量 */
const handleQuantityChange = (val: number) => {
  if (formType.value === 'create') {
    formData.value.availableQuantity = val
  }
}

/** 工具类型变更 */
const handleToolTypeChange = (item: TmToolTypeVO | undefined) => {
  selectedToolType.value = item
  // 如果是编码管理，数量锁定为 1
  if (item?.codeFlag === true) {
    formData.value.quantity = 1
    formData.value.availableQuantity = 1
  }
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as TmToolVO // 提交到后端
    if (formType.value === 'create') {
      await TmToolApi.createTool(data)
      message.success(t('common.createSuccess'))
    } else {
      await TmToolApi.updateTool(data)
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
    toolTypeId: undefined,
    quantity: 1,
    availableQuantity: 1,
    maintenType: undefined,
    nextMaintenPeriod: undefined,
    nextMaintenDate: undefined,
    status: MesToolStatusEnum.STORE,
    remark: undefined
  }
  selectedToolType.value = undefined
  formRef.value?.resetFields()
}
</script>
