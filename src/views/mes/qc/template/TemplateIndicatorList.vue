<!-- MES 质检方案-检测指标项 子列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button
        type="primary"
        plain
        size="small"
        @click="openForm('create')"
        v-hasPermi="['mes:qc-template:create']"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增指标项
      </el-button>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="检测项编码" align="center" prop="indicatorCode" width="140" />
      <el-table-column label="检测项名称" align="center" prop="indicatorName" min-width="150" />
      <el-table-column label="检测项类型" align="center" prop="indicatorType" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_INDEX_TYPE" :value="scope.row.indicatorType" />
        </template>
      </el-table-column>
      <el-table-column label="检测工具" align="center" prop="indicatorTool" width="120" />
      <el-table-column label="检测方法" align="center" prop="checkMethod" min-width="180" />
      <el-table-column label="标准值" align="center" prop="standardValue" width="100" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="误差上限" align="center" prop="thresholdMax" width="100" />
      <el-table-column label="误差下限" align="center" prop="thresholdMin" width="100" />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-template:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-template:update']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="质检指标" prop="indicatorId">
              <QcIndicatorSelect
                v-model="formData.indicatorId"
                placeholder="请选择质检指标"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标准值" prop="standardValue">
              <el-input-number
                v-model="formData.standardValue"
                placeholder="请输入标准值"
                :precision="4"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="计量单位" prop="unitMeasureId">
              <MdUnitMeasureSelect
                v-model="formData.unitMeasureId"
                placeholder="请选择计量单位"
                clearable
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="误差上限" prop="thresholdMax">
              <el-input-number
                v-model="formData.thresholdMax"
                placeholder="请输入"
                :precision="4"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="误差下限" prop="thresholdMin">
              <el-input-number
                v-model="formData.thresholdMin"
                placeholder="请输入"
                :precision="4"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="检测方法" prop="checkMethod">
              <el-input
                type="textarea"
                v-model="formData.checkMethod"
                placeholder="请输入检测方法"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="说明图URL" prop="docUrl">
              <el-input v-model="formData.docUrl" placeholder="请输入说明图URL" />
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
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { QcTemplateIndicatorApi, QcTemplateIndicatorVO } from '@/api/mes/qc/template/indicator/index'
import QcIndicatorSelect from '@/views/mes/qc/indicator/components/QcIndicatorSelect.vue'
import MdUnitMeasureSelect from '@/views/mes/md/unitmeasure/components/MdUnitMeasureSelect.vue'

defineOptions({ name: 'TemplateIndicatorList' })

const props = defineProps<{ templateId: number }>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<QcTemplateIndicatorVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  if (!props.templateId) return
  loading.value = true
  try {
    const data = await QcTemplateIndicatorApi.getTemplateIndicatorPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined,
  templateId: undefined as number | undefined,
  indicatorId: undefined,
  checkMethod: undefined,
  standardValue: undefined,
  unitMeasureId: undefined,
  thresholdMax: undefined,
  thresholdMin: undefined,
  docUrl: undefined,
  remark: undefined
})
const formRules = reactive({
  indicatorId: [{ required: true, message: '质检指标不能为空', trigger: 'change' }]
})

/** 添加/修改操作 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.templateId = props.templateId
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcTemplateIndicatorApi.getTemplateIndicator(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcTemplateIndicatorVO
    if (formType.value === 'create') {
      await QcTemplateIndicatorApi.createTemplateIndicator(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateIndicatorApi.updateTemplateIndicator(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    templateId: undefined,
    indicatorId: undefined,
    checkMethod: undefined,
    standardValue: undefined,
    unitMeasureId: undefined,
    thresholdMax: undefined,
    thresholdMin: undefined,
    docUrl: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await QcTemplateIndicatorApi.deleteTemplateIndicator(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 监听 templateId 变化，重新加载列表 */
watch(
  () => props.templateId,
  () => getList(),
  { immediate: true }
)
</script>
