<!-- MES 生产流转卡表单 -->
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
          <el-form-item label="流转卡编码" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入流转卡编码"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品" prop="itemId">
            <MdItemSelect v-model="formData.itemId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="流转数量" prop="transferedQuantity">
            <el-input-number
              v-model="formData.transferedQuantity"
              :min="0"
              :precision="2"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input
              v-model="formData.batchCode"
              placeholder="请输入批次号"
              :disabled="isHeaderReadonly"
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
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 工序记录子表：非新建模式显示 -->
    <template v-if="formData.id">
      <el-divider content-position="center">工序记录</el-divider>
      <CardProcessList :card-id="formData.id" :disabled="!isEditable" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesProCardStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isExecute" @click="handleExecute" type="success" :disabled="formLoading">
        执 行
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProCardApi, ProCardVO } from '@/api/mes/pro/card'
import { generateRandomStr } from '@/utils'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import CardProcessList from './CardProcessList.vue'
import { MesProCardStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'CardForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / execute / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isExecute = computed(() => formType.value === 'execute') // 是否为执行模式
const isDetail = computed(() => ['detail', 'execute'].includes(formType.value)) // 是否为详情模式（表单只读）
const isHeaderReadonly = computed(() => ['execute', 'detail'].includes(formType.value)) // 头部是否只读
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增流转卡',
    update: '编辑流转卡',
    execute: '执行流转卡',
    detail: '流转卡详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined as string | undefined,
  workOrderId: undefined as number | undefined,
  batchCode: undefined as string | undefined,
  itemId: undefined as number | undefined,
  transferedQuantity: undefined as number | undefined,
  status: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  code: [{ required: true, message: '流转卡编码不能为空', trigger: 'blur' }],
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  transferedQuantity: [{ required: true, message: '流转数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成流转卡编码 */
const generateCode = () => {
  formData.value.code = 'CARD' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/执行/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProCardApi.getCard(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}

/** 提交表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProCardVO
    if (formType.value === 'create') {
      const res = await ProCardApi.createCard(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesProCardStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await ProCardApi.updateCard(data)
      message.success('修改成功')
    }
    // 更新快照
    originalFormData.value = JSON.stringify(formData.value)
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：表单修改过则先保存，再提交 */
const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    await message.confirm('确认提交该流转卡？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as ProCardVO
      await ProCardApi.updateCard(data)
    }
    // 2. 提交流转卡
    await ProCardApi.submitCard(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行流转卡 */
const handleExecute = async () => {
  try {
    await message.confirm('确认执行该流转卡？')
    formLoading.value = true
    await ProCardApi.executeCard(formData.value.id!)
    message.success('执行成功')
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
    workOrderId: undefined,
    batchCode: undefined,
    itemId: undefined,
    transferedQuantity: undefined,
    status: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
