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
    >
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="检验单编号" prop="code">
            <!-- TODO @AI：参考别的模块，搞一下； -->
            <el-input v-model="formData.code" placeholder="请输入检验单编号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检验单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入检验单名称" />
          </el-form-item>
        </el-col>
        <!-- TODO @AI：貌似不用填写这个字段哈 -->
        <el-col :span="8">
          <el-form-item label="检验模板" prop="templateId">
            <el-select
              v-model="formData.templateId"
              placeholder="请选择检验模板"
              filterable
              class="!w-1/1"
            >
              <el-option
                v-for="item in templateList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">物料与供应商</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" placeholder="请选择产品物料" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" placeholder="请选择供应商" class="!w-1/1" />
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
          <el-form-item label="接收数量" prop="receivedQuantity">
            <el-input-number
              v-model="formData.receivedQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="合格品数量" prop="qualifiedQuantity">
            <el-input-number
              v-model="formData.qualifiedQuantity"
              :min="0"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="不合格品数量" prop="unqualifiedQuantity">
            <el-input-number
              v-model="formData.unqualifiedQuantity"
              :min="0"
              placeholder="请输入"
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
        <!-- TODO @AI：应该不用填写 -->
        <el-col :span="8">
          <el-form-item label="检测人员" prop="inspectorUserId">
            <UserSelect
              v-model="formData.inspectorUserId"
              placeholder="请选择检测人员"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
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
          <IqcLineList :iqc-id="formData.id" />
        </el-tab-pane>
        <!-- TODO @AI：应该是 IqcDefectList；可以重构到 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/qc/defect/record/components/ 提供给每个模块使用，传递 qc-id、qc-type； -->
        <el-tab-pane label="缺陷记录" name="defect">
          <IqcDefectList :iqc-id="formData.id" />
        </el-tab-pane>
        <!-- TODO @AI：检测结果；缺少一个 List -->
      </el-tabs>
    </template>

    <template #footer>
      <el-button
        @click="submitForm"
        type="primary"
        :disabled="formLoading"
      >
        保 存
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { QcIqcApi, QcIqcVO } from '@/api/mes/qc/iqc'
import { QcTemplateApi } from '@/api/mes/qc/template'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import IqcLineList from './IqcLineList.vue'
import IqcDefectList from './IqcDefectList.vue'

defineOptions({ name: 'IqcForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const activeTab = ref('line')

// 模板列表
const templateList = ref<any[]>([])

const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  templateId: undefined,
  sourceDocId: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  sourceLineId: undefined,
  vendorId: undefined,
  vendorBatch: undefined,
  itemId: undefined,
  minCheckQuantity: undefined,
  maxUnqualifiedQuantity: undefined,
  receivedQuantity: undefined,
  checkQuantity: undefined,
  qualifiedQuantity: undefined,
  unqualifiedQuantity: undefined,
  checkResult: undefined,
  receiveDate: undefined,
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
  templateId: [{ required: true, message: '检验模板不能为空', trigger: 'change' }],
  vendorId: [{ required: true, message: '供应商不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }],
  receivedQuantity: [{ required: true, message: '接收数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  activeTab.value = 'line'
  resetForm()
  // 加载模板列表
  templateList.value = await QcTemplateApi.getTemplateSimpleList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcIqcApi.getIqc(id)
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
    const data = formData.value as unknown as QcIqcVO
    if (formType.value === 'create') {
      await QcIqcApi.createIqc(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcIqcApi.updateIqc(data)
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
    templateId: undefined,
    sourceDocId: undefined,
    sourceDocType: undefined,
    sourceDocCode: undefined,
    sourceLineId: undefined,
    vendorId: undefined,
    vendorBatch: undefined,
    itemId: undefined,
    minCheckQuantity: undefined,
    maxUnqualifiedQuantity: undefined,
    receivedQuantity: undefined,
    checkQuantity: undefined,
    qualifiedQuantity: undefined,
    unqualifiedQuantity: undefined,
    checkResult: undefined,
    receiveDate: undefined,
    inspectDate: undefined,
    inspectorUserId: undefined,
    remark: undefined,
    status: 0, // TODO @AI：默认值，不用填写；
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
