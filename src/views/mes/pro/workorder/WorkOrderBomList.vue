<!-- MES 生产工单 BOM 列表子组件 -->
<template>
  <div>
    <!-- BOM 列表 -->
    <el-table v-loading="loading" :data="bomList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="BOM 物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="BOM 物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="预计使用量" align="center" prop="quantity" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="160" v-if="!disabled">
        <template #default="scope">
          <!-- 草稿状态：编辑数量/备注 -->
          <!-- TODO @AI：workOrder 来自父组件 WorkOrderForm 通过 prop :work-order="formData" 传入，即当前工单的完整数据 -->
          <el-button
            v-if="workOrder.status === MesProWorkOrderStatusEnum.PREPARE"
            link
            type="primary"
            @click="openBomForm('update', scope.row)"
          >
            编辑
          </el-button>
          <!-- 已确认 + 自行生产 + 产品类型 BOM 行：生成工单 -->
          <el-button
            v-if="
              workOrder.status === MesProWorkOrderStatusEnum.CONFIRMED &&
              workOrder.type === MesProWorkOrderTypeEnum.SELF &&
              scope.row.itemOrProduct === 'PRODUCT'
            "
            link
            type="success"
            @click="handleGenerateWorkOrder(scope.row)"
          >
            生成工单
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="bomTotal"
      v-model:page="bomQueryParams.pageNo"
      v-model:limit="bomQueryParams.pageSize"
      @pagination="getBomList"
    />

    <!-- BOM 编辑弹窗（内联） -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label="物料">
          <el-input :model-value="formData.itemName" disabled />
        </el-form-item>
        <el-form-item label="单位">
          <el-input :model-value="formData.unitMeasureName" disabled />
        </el-form-item>
        <el-form-item label="预计使用量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="0" :precision="2" class="!w-1/1" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ProWorkOrderBomApi, ProWorkOrderBomVO } from '@/api/mes/pro/workorder/bom'
import { MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'WorkOrderBomList' })

const props = defineProps<{
  workOrderId: number
  workOrder: any
  disabled?: boolean
}>()

// generate-work-order：通知 WorkOrderForm 用 BOM 行的物料作为产品，新建子工单
const emit = defineEmits(['generate-work-order'])

const message = useMessage()
const { t } = useI18n()

// ==================== BOM 列表 ====================
const loading = ref(false)
const bomList = ref<ProWorkOrderBomVO[]>([])
const bomTotal = ref(0)
const bomQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  workOrderId: undefined as number | undefined
})

/** 查询 BOM 列表 */
const getBomList = async () => {
  loading.value = true
  try {
    bomQueryParams.workOrderId = props.workOrderId
    const data = await ProWorkOrderBomApi.getWorkOrderBomPage(bomQueryParams)
    bomList.value = data.list
    bomTotal.value = data.total
  } finally {
    loading.value = false
  }
}

/** 生成工单（通知父组件） */
// todo @芋艿：后续在测试下该逻辑；
const handleGenerateWorkOrder = (row: any) => {
  emit('generate-work-order', row)
}

// ==================== BOM 编辑表单（内联） ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const formData = ref({
  id: undefined as number | undefined,
  workOrderId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  itemName: undefined as string | undefined,
  unitMeasureId: undefined as number | undefined,
  unitMeasureName: undefined as string | undefined,
  quantity: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  quantity: [{ required: true, message: '预计使用量不能为空', trigger: 'blur' }]
})

/** 打开 BOM 编辑弹窗 */
const openBomForm = (_type: string, row: any) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑 BOM 物料'
  formData.value = {
    id: row.id,
    workOrderId: row.workOrderId,
    itemId: row.itemId,
    itemName: row.itemName,
    unitMeasureId: row.unitMeasureId,
    unitMeasureName: row.unitMeasureName,
    quantity: row.quantity,
    remark: row.remark
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = {
      id: formData.value.id,
      workOrderId: formData.value.workOrderId,
      itemId: formData.value.itemId,
      unitMeasureId: formData.value.unitMeasureId,
      quantity: formData.value.quantity,
      remark: formData.value.remark
    } as unknown as ProWorkOrderBomVO
    await ProWorkOrderBomApi.updateWorkOrderBom(data)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    await getBomList()
  } finally {
    formLoading.value = false
  }
}

// ==================== 初始化 ====================
onMounted(async () => {
  await getBomList()
})
</script>
