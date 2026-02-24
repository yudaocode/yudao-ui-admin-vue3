<!-- MES 出货检验单表单 -->
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
        <!-- TODO @AI：不用前端选择，后端自己计算出来！ -->
        <el-col :span="8">
          <el-form-item label="质检方案" prop="templateId">
            <QcTemplateSelect v-model="formData.templateId" class="!w-1/1" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">物料与客户</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" placeholder="请选择产品物料" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" placeholder="请选择客户" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">检测情况</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="发货数量" prop="outQuantity">
            <el-input-number
              v-model="formData.outQuantity"
              :min="0"
              :precision="2"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="检测数量" prop="checkQuantity">
            <el-input-number
              v-model="formData.checkQuantity"
              :min="0"
              placeholder="请输入"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <!-- TODO @AI：不需要 qualifiedQuantity 参数 -->
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
          <el-form-item label="发货日期" prop="outDate">
            <el-date-picker
              v-model="formData.outDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择发货日期"
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
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 缺陷统计（只读） -->
      <template>
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
          <OqcLineList :oqc-id="formData.id" />
        </el-tab-pane>
        <el-tab-pane label="检测结果" name="result">
          <QcIndicatorResultList :qc-id="formData.id!" :qc-type="MesQcTypeEnum.OQC" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading"> 保 存 </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { generateRandomStr } from '@/utils'
import { QcOqcApi, QcOqcVO } from '@/api/mes/qc/oqc'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import QcTemplateSelect from '@/views/mes/qc/template/components/QcTemplateSelect.vue'
import OqcLineList from './OqcLineList.vue'
import QcIndicatorResultList from '@/views/mes/qc/indicatorresult/components/QcIndicatorResultList.vue'
import { MesQcTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'OqcForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const activeTab = ref('line') // 当前激活的标签页

const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  templateId: undefined,
  sourceDocId: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  sourceLineId: undefined,
  clientId: undefined,
  batchCode: undefined,
  itemId: undefined,
  minCheckQuantity: undefined,
  maxUnqualifiedQuantity: undefined,
  outQuantity: undefined,
  checkQuantity: undefined,
  qualifiedQuantity: undefined,
  unqualifiedQuantity: undefined,
  checkResult: undefined,
  outDate: undefined,
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
// TODO @AI：检测数量、发货数量；必填；
// TODO @AI：发货日期、检测日期、检测人员；必填
const formRules = reactive({
  code: [{ required: true, message: '检验单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '检验单名称不能为空', trigger: 'blur' }],
  templateId: [{ required: true, message: '检验模板不能为空', trigger: 'change' }],
  clientId: [{ required: true, message: '客户不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }],
  outQuantity: [{ required: true, message: '发货数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 生成检验单编号 */
const generateCode = () => {
  formData.value.code = 'OQC' + generateRandomStr(10)
}

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
      formData.value = await QcOqcApi.getOqc(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcOqcVO
    if (formType.value === 'create') {
      await QcOqcApi.createOqc(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcOqcApi.updateOqc(data)
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
    templateId: undefined,
    sourceDocId: undefined,
    sourceDocType: undefined,
    sourceDocCode: undefined,
    sourceLineId: undefined,
    clientId: undefined,
    batchCode: undefined,
    itemId: undefined,
    minCheckQuantity: undefined,
    maxUnqualifiedQuantity: undefined,
    outQuantity: undefined,
    checkQuantity: undefined,
    qualifiedQuantity: undefined,
    unqualifiedQuantity: undefined,
    checkResult: undefined,
    outDate: undefined,
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
