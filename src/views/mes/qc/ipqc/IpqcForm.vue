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
    >
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检验单编号" prop="code">
            <!-- TODO @芋艿：自动编码未迁移，暂用手动输入 -->
            <el-input v-model="formData.code" placeholder="请输入检验单编号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检验单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入检验单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检验类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择检验类型"
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.MES_IPQC_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">生产关联</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              placeholder="请选择生产工单"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工位" prop="workstationId">
            <MdWorkstationSelect
              v-model="formData.workstationId"
              placeholder="请选择工位"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产任务" prop="taskId">
            <ProTaskSelect
              v-model="formData.taskId"
              placeholder="请选择生产任务"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">检测情况</el-divider>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="检测数量" prop="checkQuantity">
            <el-input-number
              v-model="formData.checkQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="合格品数量" prop="qualifiedQuantity">
            <el-input-number
              v-model="formData.qualifiedQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="不合格品数量" prop="unqualifiedQuantity">
            <el-input-number
              v-model="formData.unqualifiedQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="工废数量" prop="laborScrapQuantity">
            <el-input-number
              v-model="formData.laborScrapQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="料废数量" prop="materialScrapQuantity">
            <el-input-number
              v-model="formData.materialScrapQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="其他废品数量" prop="otherScrapQuantity">
            <el-input-number
              v-model="formData.otherScrapQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检测日期" prop="inspectDate">
            <el-date-picker
              v-model="formData.inspectDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择检测日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
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
          <el-form-item label="检测结论" prop="checkResult">
            <el-select
              v-model="formData.checkResult"
              placeholder="请选择检测结论"
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
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 缺陷统计（只读） -->
      <template v-if="formType === 'update' && formData.id">
        <el-divider content-position="left">缺陷情况</el-divider>
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
      </template>
    </el-form>

    <!-- 子表标签页（编辑模式下显示） -->
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
      <el-button
        @click="submitForm"
        type="primary"
        :disabled="formLoading"
        v-if="formData.status === 0"
      >
        保 存
      </el-button>
      <!-- TODO @AI：这里去掉，用不到；只需要在 index.vue 有就可以了 -->
      <el-button
        @click="handleComplete"
        type="success"
        :disabled="formLoading"
        v-if="formType === 'update' && formData.id && formData.status === 0"
      >
        完 成
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { QcIpqcApi, QcIpqcVO } from '@/api/mes/qc/ipqc'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import ProTaskSelect from '@/views/mes/pro/task/components/ProTaskSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import IpqcLineList from './IpqcLineList.vue'
import QcIndicatorResultList from '@/views/mes/qc/indicatorresult/components/QcIndicatorResultList.vue'
import { MesQcTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'IpqcForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const activeTab = ref('line')

const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  templateId: undefined,
  sourceDocId: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  sourceLineId: undefined,
  workOrderId: undefined,
  taskId: undefined,
  workstationId: undefined,
  processId: undefined,
  itemId: undefined,
  checkQuantity: undefined,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  laborScrapQuantity: 0,
  materialScrapQuantity: 0,
  otherScrapQuantity: 0,
  checkResult: undefined,
  inspectDate: undefined,
  inspectorUserId: undefined,
  remark: undefined,
  status: 0,
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
  workstationId: [{ required: true, message: '工位不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  activeTab.value = 'line'
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await QcIpqcApi.getIpqc(id)
      formData.value = data
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
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
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 完成操作 */
const handleComplete = async () => {
  try {
    await message.confirm('确认完成该过程检验单？完成后不可修改。')
    formLoading.value = true
    // 先保存
    await QcIpqcApi.updateIpqc(formData.value as unknown as QcIpqcVO)
    // 再完成
    await QcIpqcApi.completeIpqc(formData.value.id!)
    message.success('完成成功')
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
    type: undefined,
    templateId: undefined,
    sourceDocId: undefined,
    sourceDocType: undefined,
    sourceDocCode: undefined,
    sourceLineId: undefined,
    workOrderId: undefined,
    taskId: undefined,
    workstationId: undefined,
    processId: undefined,
    itemId: undefined,
    checkQuantity: undefined,
    qualifiedQuantity: 0,
    unqualifiedQuantity: 0,
    laborScrapQuantity: 0,
    materialScrapQuantity: 0,
    otherScrapQuantity: 0,
    checkResult: undefined,
    inspectDate: undefined,
    inspectorUserId: undefined,
    remark: undefined,
    status: 0,
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
