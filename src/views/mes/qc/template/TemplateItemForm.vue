<!-- MES 质检方案-产品关联 表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" placeholder="请选择产品物料" class="!w-1/1" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="最低检测数" prop="quantityCheck">
            <el-input-number
              v-model="formData.quantityCheck"
              placeholder="请输入最低检测数"
              :min="1"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="最大不合格数" prop="quantityUnqualified">
            <el-tooltip content="超出最大不合格数后整批判定不合格，0表示不启用" placement="top">
              <el-input-number
                v-model="formData.quantityUnqualified"
                placeholder="0表示不启用"
                :min="0"
                class="!w-1/1"
              />
            </el-tooltip>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="致命缺陷率(%)" prop="criticalRate">
            <el-tooltip content="缺陷比例超出后整批判定不合格，0表示不允许出现" placement="top">
              <el-input-number
                v-model="formData.criticalRate"
                placeholder="0表示不允许"
                :min="0"
                :max="100"
                :precision="2"
                class="!w-1/1"
              />
            </el-tooltip>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="严重缺陷率(%)" prop="majorRate">
            <el-tooltip content="缺陷比例超出后整批判定不合格，0表示不允许出现" placement="top">
              <el-input-number
                v-model="formData.majorRate"
                placeholder="0表示不允许"
                :min="0"
                :max="100"
                :precision="2"
                class="!w-1/1"
              />
            </el-tooltip>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="轻微缺陷率(%)" prop="minorRate">
            <el-tooltip content="缺陷比例超出后整批判定不合格，0表示不允许出现" placement="top">
              <el-input-number
                v-model="formData.minorRate"
                :min="0"
                :max="100"
                :precision="2"
                class="!w-1/1"
              />
            </el-tooltip>
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
</template>

<script setup lang="ts">
import { QcTemplateItemApi, QcTemplateItemVO } from '@/api/mes/qc/template/item'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'TemplateItemForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  templateId: undefined as number | undefined,
  itemId: undefined,
  quantityCheck: 1,
  quantityUnqualified: 0,
  criticalRate: 0,
  majorRate: 0,
  minorRate: 100,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }],
  quantityCheck: [{ required: true, message: '最低检测数不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number, templateId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.templateId = templateId
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcTemplateItemApi.getTemplateItem(id)
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
    const data = formData.value as unknown as QcTemplateItemVO
    if (formType.value === 'create') {
      await QcTemplateItemApi.createTemplateItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateItemApi.updateTemplateItem(data)
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
    templateId: undefined,
    itemId: undefined,
    quantityCheck: 1,
    quantityUnqualified: 0,
    criticalRate: 0,
    majorRate: 0,
    minorRate: 100,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
