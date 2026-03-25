<!-- MES 过程检验单表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1080px">
    <!-- 基本信息表单 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检验单编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入检验单编号">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检验单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入检验单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检验类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择检验类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_IPQC_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>生产关联</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              placeholder="请选择生产工单"
              class="!w-1/1"
              :disabled="isFromPendingTask"
              @change="handleWorkOrderChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工位" prop="workstationId">
            <MdWorkstationSelect
              v-model="formData.workstationId"
              placeholder="请选择工位"
              class="!w-1/1"
              :disabled="isFromPendingTask"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产任务" prop="taskId">
            <ProTaskSelect
              v-model="formData.taskId"
              :workOrderId="formData.workOrderId"
              placeholder="请选择生产任务"
              class="!w-1/1"
              :disabled="isFromPendingTask || (!isFromPendingTask && !formData.workOrderId)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>检测情况</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检测数量" prop="checkQuantity">
            <el-input-number
              v-model="formData.checkQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入检测数量"
              class="!w-1/1"
              :disabled="isFromPendingTask"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="合格品数量" prop="qualifiedQuantity">
            <el-input-number
              v-model="formData.qualifiedQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入合格品数量"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="不合格品数量" prop="unqualifiedQuantity">
            <el-input-number
              v-model="formData.unqualifiedQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入不合格品数量"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 废品数量（当不合格数量大于 0 时显示） -->
      <el-row :gutter="16" v-if="formData.unqualifiedQuantity && formData.unqualifiedQuantity > 0">
        <el-col :span="8">
          <el-form-item label="工废数量" prop="laborScrapQuantity">
            <el-input-number
              v-model="formData.laborScrapQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入工废数量"
              class="!w-1/1"
              @change="handleScrapChanged"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="料废数量" prop="materialScrapQuantity">
            <el-input-number
              v-model="formData.materialScrapQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入料废数量"
              class="!w-1/1"
              @change="handleScrapChanged"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="其他废品数量" prop="otherScrapQuantity">
            <el-input-number
              v-model="formData.otherScrapQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入其他废品数量"
              class="!w-1/1"
              @change="handleScrapChanged"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检测人员" prop="inspectorUserId">
            <UserSelect
              v-model="formData.inspectorUserId"
              placeholder="请选择检测人员"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检测日期" prop="inspectDate">
            <el-date-picker
              v-model="formData.inspectDate"
              type="date"
              value-format="x"
              placeholder="请选择检测日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检测结果" prop="checkResult">
            <el-select
              v-model="formData.checkResult"
              placeholder="请选择检测结果"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 缺陷统计（只读） -->
      <el-divider>缺陷情况</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="致命缺陷数">
            <el-input :model-value="formData.criticalQuantity" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="严重缺陷数">
            <el-input :model-value="formData.majorQuantity" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="轻微缺陷数">
            <el-input :model-value="formData.minorQuantity" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="致命缺陷率">
            <el-input :model-value="formData.criticalRate + '%'" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="严重缺陷率">
            <el-input :model-value="formData.majorRate + '%'" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="轻微缺陷率">
            <el-input :model-value="formData.minorRate + '%'" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 子表标签页（编辑/详情模式下显示） -->
    <template v-if="formType === 'update' && formData.id">
      <el-divider />
      <el-tabs v-model="activeTab">
        <el-tab-pane label="检验项" name="line">
          <IpqcLineList :ipqc-id="formData.id" />
        </el-tab-pane>
        <el-tab-pane label="检测结果" name="result">
          <QcIndicatorResultList :qc-id="formData.id!" :qc-type="MesQcTypeEnum.IPQC" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!isDetail">
        保 存
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { QcIpqcApi, QcIpqcVO } from '@/api/mes/qc/ipqc'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import ProTaskSelect from '@/views/mes/pro/task/components/ProTaskSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import IpqcLineList from './IpqcLineList.vue'
import QcIndicatorResultList from '@/views/mes/qc/indicatorresult/components/QcIndicatorResultList.vue'
import { MesQcTypeEnum, MesAutoCodeRuleCode } from '@/views/mes/utils/constants'

defineOptions({ name: 'IpqcForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const activeTab = ref('line') // 当前激活的标签页
const dialogTitle = computed(() => {
  const titles = {
    create: '新增过程检验单',
    update: '修改过程检验单',
    detail: '查看过程检验单'
  }
  return titles[formType.value] || t('action.' + formType.value)
}) // 弹窗标题，根据 formType 自动显示
const isDetail = computed(() => formType.value === 'detail') // 表单是否为详情模式（只读）
const isFromPendingTask = computed(
  () => formType.value === 'create' && formData.value.sourceDocId != null
) // 是否来自待检任务（有预填的来源单据信息）

const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  templateId: undefined,
  sourceDocId: undefined,
  sourceDocType: undefined,
  sourceLineId: undefined,
  workOrderId: undefined,
  taskId: undefined,
  workstationId: undefined,
  processId: undefined,
  itemId: undefined,
  checkQuantity: undefined,
  qualifiedQuantity: undefined,
  unqualifiedQuantity: undefined,
  laborScrapQuantity: 0,
  materialScrapQuantity: 0,
  otherScrapQuantity: 0,
  checkResult: undefined,
  inspectDate: undefined,
  inspectorUserId: undefined,
  remark: undefined,
  // 缺陷统计（只读）
  criticalRate: 0,
  majorRate: 0,
  minorRate: 0,
  criticalQuantity: 0,
  majorQuantity: 0,
  minorQuantity: 0
})
const formRules = reactive({
  code: [{ required: true, message: '检验单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '检验单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '检验类型不能为空', trigger: 'change' }],
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  workstationId: [{ required: true, message: '工位不能为空', trigger: 'change' }],
  checkQuantity: [{ required: true, message: '检测数量不能为空', trigger: 'blur' }],
  qualifiedQuantity: [{ required: true, message: '合格品数量不能为空', trigger: 'blur' }],
  unqualifiedQuantity: [{ required: true, message: '不合格品数量不能为空', trigger: 'blur' }],
  laborScrapQuantity: [{ required: true, message: '工废数量不能为空', trigger: 'blur' }],
  materialScrapQuantity: [{ required: true, message: '料废数量不能为空', trigger: 'blur' }],
  otherScrapQuantity: [{ required: true, message: '其他废品数量不能为空', trigger: 'blur' }],
  inspectorUserId: [{ required: true, message: '检测人员不能为空', trigger: 'change' }],
  inspectDate: [{ required: true, message: '检测日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成检验单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.QC_IPQC_CODE)
}

/** 废品明细变更：自动计算不合格品数量 = 工废 + 料废 + 其他 */
const handleScrapChanged = () => {
  formData.value.unqualifiedQuantity =
    (formData.value.laborScrapQuantity || 0) +
    (formData.value.materialScrapQuantity || 0) +
    (formData.value.otherScrapQuantity || 0)
}

/** 生产工单变更：清空关联的任务等信息 */
const handleWorkOrderChange = () => {
  formData.value.taskId = undefined
}

/** 打开弹窗 */
const open = async (type: string, id?: number, data?: QcIpqcVO) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'line'
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcIpqcApi.getIpqc(id)
    } finally {
      formLoading.value = false
    }
  } else if (data) {
    // 预填模式：来自待检任务（pending inspect）
    Object.assign(formData.value, data)
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcIpqcVO
    if (formType.value === 'create') {
      await QcIpqcApi.createIpqc(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcIpqcApi.updateIpqc(data)
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
    type: undefined,
    templateId: undefined,
    sourceDocId: undefined,
    sourceDocType: undefined,
    sourceLineId: undefined,
    workOrderId: undefined,
    taskId: undefined,
    workstationId: undefined,
    processId: undefined,
    itemId: undefined,
    checkQuantity: undefined,
    qualifiedQuantity: undefined,
    unqualifiedQuantity: undefined,
    laborScrapQuantity: 0,
    materialScrapQuantity: 0,
    otherScrapQuantity: 0,
    checkResult: undefined,
    inspectDate: undefined,
    inspectorUserId: undefined,
    remark: undefined,
    criticalRate: 0,
    majorRate: 0,
    minorRate: 0,
    criticalQuantity: 0,
    majorQuantity: 0,
    minorQuantity: 0
  }
  formRef.value?.resetFields()
}
</script>
