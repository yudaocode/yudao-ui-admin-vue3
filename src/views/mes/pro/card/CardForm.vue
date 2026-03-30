<!-- MES 生产流转卡表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="流转卡编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入流转卡编码" :disabled="isDetail">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品" prop="itemId">
            <MdItemSelect v-model="formData.itemId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="流转数量" prop="transferedQuantity">
            <el-input-number
              v-model="formData.transferedQuantity"
              :min="0"
              :precision="2"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input
              v-model="formData.batchCode"
              placeholder="请输入批次号"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 工序记录子表：编辑/详情时显示 -->
    <el-tabs v-if="formType !== 'create'" v-model="activeTab" class="mt-15px">
      <el-tab-pane label="工序记录" name="process">
        <CardProcessList v-if="formData.id" :card-id="formData.id" :disabled="isDetail" />
      </el-tab-pane>
    </el-tabs>
    <template #footer v-if="!isDetail">
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProCardApi, ProCardVO } from '@/api/mes/pro/card'
import { generateRandomStr } from '@/utils'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import CardProcessList from './CardProcessList.vue'

defineOptions({ name: 'CardForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const activeTab = ref('process') // 活跃的 Tab
const formData = ref({
  id: undefined,
  code: undefined,
  workOrderId: undefined,
  batchCode: undefined,
  itemId: undefined,
  transferedQuantity: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '流转卡编码不能为空', trigger: 'blur' }],
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  transferedQuantity: [{ required: true, message: '流转数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 是否为详情模式 */
const isDetail = computed(() => formType.value === 'detail')

/** 生成流转卡编码 */
const generateCode = () => {
  formData.value.code = 'CARD' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'detail' ? '流转卡详情' : t('action.' + type)
  formType.value = type
  activeTab.value = 'process'
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProCardApi.getCard(id)
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProCardVO
    if (formType.value === 'create') {
      await ProCardApi.createCard(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProCardApi.updateCard(data)
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
    workOrderId: undefined,
    batchCode: undefined,
    itemId: undefined,
    transferedQuantity: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
