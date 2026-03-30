<!-- MES 检验结果表单弹窗（含动态检测值输入） -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="样品编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入样品编号">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物资SN" prop="sn">
            <el-input v-model="formData.sn" placeholder="请输入物资SN" />
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

      <!-- 检测值列表 -->
      <el-divider>检测值</el-divider>
      <div v-for="(item, index) in formData.items" :key="index">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="'检测项' + (index + 1)">
              <el-input :model-value="item.indicatorName" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 数值（浮点/整数） -->
            <el-form-item
              v-if="
                [MesQcResultValueType.FLOAT, MesQcResultValueType.INTEGER].includes(item.valueType)
              "
              label="检测值"
            >
              <el-input-number
                v-model="item.valueNumber"
                :precision="item.valueType === MesQcResultValueType.FLOAT ? 4 : 0"
                placeholder="请输入"
                class="!w-1/1"
              />
            </el-form-item>
            <!-- 文本值 -->
            <el-form-item v-else-if="item.valueType === MesQcResultValueType.TEXT" label="检测值">
              <el-input v-model="item.value" type="textarea" placeholder="请输入检测值" />
            </el-form-item>
            <!-- 字典值 -->
            <el-form-item v-else-if="item.valueType === MesQcResultValueType.DICT" label="检测值">
              <el-select v-model="item.value" placeholder="请选择" class="!w-1/1">
                <el-option
                  v-for="dict in getStrDictOptions(item.valueSpecification)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <!-- 文件值 -->
            <el-form-item v-else-if="item.valueType === MesQcResultValueType.FILE" label="检测值">
              <el-input v-model="item.value" placeholder="请输入文件地址" />
            </el-form-item>
            <!-- 未知类型 -->
            <el-form-item v-else label="检测值">
              <el-input v-model="item.value" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider v-if="index < formData.items.length - 1" />
      </div>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcIndicatorResultApi } from '@/api/mes/qc/indicatorresult'
import { getStrDictOptions } from '@/utils/dict'
import { MesQcResultValueType } from '@/views/mes/utils/constants'
import { generateRandomStr } from '@/utils'

defineOptions({ name: 'QcIndicatorResultForm' })

const props = defineProps<{
  qcId: number
  qcType: number
}>()

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  code: undefined as string | undefined,
  qcId: undefined as number | undefined,
  qcType: undefined as number | undefined,
  sn: undefined as string | undefined,
  remark: undefined as string | undefined,
  items: [] as any[]
}) // 表单数据
const formRules = reactive({
  code: [{ required: true, message: '样品编号不能为空', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref

/** 生成样品编号 */
const generateCode = () => {
  formData.value.code = 'QR' + generateRandomStr(12)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载数据
  formLoading.value = true
  try {
    formData.value = await QcIndicatorResultApi.getDetail(props.qcId, props.qcType, id)
    formData.value.qcId = props.qcId
    formData.value.qcType = props.qcType
    // 回填数值用于 el-input-number 绑定
    formData.value.items?.forEach((item: any) => {
      if (
        [MesQcResultValueType.FLOAT, MesQcResultValueType.INTEGER].includes(item.valueType) &&
        item.value != null
      ) {
        item.valueNumber = Number(item.value)
      }
    })
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    // 构建请求
    const data = { ...formData.value }
    data.items = data.items.map((item: any) => {
      const submitItem: any = {
        id: item.id,
        indicatorId: item.indicatorId,
        remark: item.remark
      }
      if ([MesQcResultValueType.FLOAT, MesQcResultValueType.INTEGER].includes(item.valueType)) {
        submitItem.value = item.valueNumber != null ? String(item.valueNumber) : undefined
      } else {
        submitItem.value = item.value
      }
      return submitItem
    })
    // 提交请求
    if (formType.value === 'create') {
      await QcIndicatorResultApi.createResult(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcIndicatorResultApi.updateResult(data)
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
    qcId: undefined,
    qcType: undefined,
    sn: undefined,
    remark: undefined,
    items: []
  }
  formRef.value?.resetFields()
}
</script>
