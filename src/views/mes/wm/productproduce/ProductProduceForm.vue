<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="报工单号" prop="feedbackId">
            <el-input-number
              v-model="formData.feedbackId"
              :min="0"
              controls-position="right"
              placeholder="请输入报工单号"
              :disabled="isHeaderReadonly"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产任务" prop="taskId">
            <el-input-number
              v-model="formData.taskId"
              :min="0"
              controls-position="right"
              placeholder="请输入生产任务"
              :disabled="isHeaderReadonly"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站" prop="workstationId">
            <MdWorkstationSelect v-model="formData.workstationId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工序" prop="processId">
            <ProProcessSelect v-model="formData.processId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库日期" prop="produceDate">
            <el-date-picker
              v-model="formData.produceDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择入库日期"
              :disabled="isHeaderReadonly"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示行项目信息（入库物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ProductProduceLineList :produce-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmProductProduceApi, WmProductProduceVO } from '@/api/mes/wm/productproduce'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import ProProcessSelect from '@/views/mes/pro/process/components/ProProcessSelect.vue'
import ProductProduceLineList from './ProductProduceLineList.vue'

defineOptions({ name: 'ProductProduceForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / detail
const formData = ref({
  id: undefined as number | undefined,
  workOrderId: undefined,
  feedbackId: undefined,
  taskId: undefined,
  workstationId: undefined,
  processId: undefined,
  produceDate: undefined,
  remark: undefined
})
const formRules = reactive({
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  produceDate: [{ required: true, message: '入库日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

const isUpdate = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isHeaderReadonly = computed(() => formType.value === 'detail') // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增生产入库单',
    update: '编辑生产入库单',
    detail: '生产入库单详情'
  }
  return titles[formType.value] || formType.value
})

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductProduceApi.getProductProduce(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmProductProduceVO
    if (formType.value === 'create') {
      const res = await WmProductProduceApi.createProductProduce(data)
      message.success('新增成功')
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmProductProduceApi.updateProductProduce(data)
      message.success('修改成功')
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
    workOrderId: undefined,
    feedbackId: undefined,
    taskId: undefined,
    workstationId: undefined,
    processId: undefined,
    produceDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
