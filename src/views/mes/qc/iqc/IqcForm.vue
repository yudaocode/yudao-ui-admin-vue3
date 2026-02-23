<!-- MES 来料检验单表单 -->
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
      </el-row>

      <el-divider content-position="left">物料与供应商</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect
              v-model="formData.itemId"
              placeholder="请选择产品物料"
              class="!w-1/1"
              :disabled="isFromPendingTask"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect
              v-model="formData.vendorId"
              placeholder="请选择供应商"
              class="!w-1/1"
              :disabled="isFromPendingTask"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商批次号" prop="vendorBatch">
            <el-input v-model="formData.vendorBatch" placeholder="请输入供应商批次号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">检测情况</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="本次接收数量" prop="receivedQuantity">
            <el-input-number
              v-model="formData.receivedQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入本次接收数量"
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
              placeholder="请输入不合格品数量"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="来料日期" prop="receiveDate">
            <el-date-picker
              v-model="formData.receiveDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择来料日期"
              class="!w-1/1"
              :disabled="isFromPendingTask"
            />
          </el-form-item>
        </el-col>
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
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 缺陷统计（只读） -->
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
    </el-form>

    <!-- 子表标签页（编辑模式下显示） -->
    <template v-if="formType === 'update' && formData.id">
      <el-divider />
      <el-tabs v-model="activeTab">
        <el-tab-pane label="检验项" name="line">
          <IqcLineList :iqc-id="formData.id" />
        </el-tab-pane>
        <el-tab-pane label="检测结果" name="result">
          <QcIndicatorResultList :qc-id="formData.id!" :qc-type="MesQcTypeEnum.IQC" />
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
import { generateRandomStr } from '@/utils'
import { QcIqcApi, QcIqcVO } from '@/api/mes/qc/iqc'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import IqcLineList from './IqcLineList.vue'
import QcIndicatorResultList from '@/views/mes/qc/indicatorresult/components/QcIndicatorResultList.vue'
import { MesQcTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'IqcForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const activeTab = ref('line') // 当前激活的标签页
const dialogTitle = computed(() => {
  const titles = {
    create: '新增来料检验单',
    update: '修改来料检验单',
    detail: '查看来料检验单'
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
  sourceDocId: undefined,
  sourceDocType: undefined,
  sourceLineId: undefined,
  vendorId: undefined,
  vendorBatch: undefined,
  itemId: undefined,
  receivedQuantity: undefined,
  qualifiedQuantity: undefined,
  unqualifiedQuantity: undefined,
  checkResult: undefined,
  receiveDate: undefined,
  inspectDate: undefined,
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
  vendorId: [{ required: true, message: '供应商不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }],
  receivedQuantity: [{ required: true, message: '本次接收数量不能为空', trigger: 'blur' }],
  qualifiedQuantity: [{ required: true, message: '合格品数量不能为空', trigger: 'blur' }],
  unqualifiedQuantity: [{ required: true, message: '不合格品数量不能为空', trigger: 'blur' }],
  receiveDate: [{ required: true, message: '来料日期不能为空', trigger: 'change' }],
  inspectDate: [{ required: true, message: '检测日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成检验单编号 */
const generateCode = () => {
  formData.value.code = 'IQC' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number, data?: QcIqcVO) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'line'
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcIqcApi.getIqc(id)
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
    const data = formData.value as unknown as QcIqcVO
    if (formType.value === 'create') {
      const res = await QcIqcApi.createIqc(data)
      message.success(t('common.createSuccess'))
      // 新增成功后，切换到修改模式，设置 id
      formData.value.id = res
      formType.value = 'update'
    } else {
      await QcIqcApi.updateIqc(data)
      message.success(t('common.updateSuccess'))
    }
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
    sourceDocId: undefined,
    sourceDocType: undefined,
    sourceLineId: undefined,
    vendorId: undefined,
    vendorBatch: undefined,
    itemId: undefined,
    receivedQuantity: undefined,
    qualifiedQuantity: undefined,
    unqualifiedQuantity: undefined,
    checkResult: undefined,
    receiveDate: undefined,
    inspectDate: undefined,
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
