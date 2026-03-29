<!-- MES 生产工单 BOM 列表子组件 -->
<template>
  <div class="overflow-hidden">
    <!-- BOM 列表 -->
    <el-table v-loading="loading" :data="bomList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="BOM 物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="BOM 物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="物料/产品" align="center" prop="itemOrProduct" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="scope.row.itemOrProduct" />
        </template>
      </el-table-column>
      <el-table-column label="预计使用量" align="center" prop="quantity" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column
        label="操作"
        align="center"
        width="160"
        fixed="right"
        v-if="
          [MesProWorkOrderStatusEnum.PREPARE, MesProWorkOrderStatusEnum.CONFIRMED].includes(
            workOrder.status
          )
        "
      >
        <template #default="scope">
          <!-- 草稿状态：编辑数量/备注 -->
          <el-button
            v-if="workOrder.status === MesProWorkOrderStatusEnum.PREPARE"
            link
            type="primary"
            @click="openForm('update', scope.row)"
          >
            编辑
          </el-button>
          <!-- 已确认 + 自行生产 + 产品类型 BOM 行：生成子工单 -->
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
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'WorkOrderBomList' })

const props = defineProps<{
  workOrderId: number
  workOrder: any
  disabled?: boolean
}>()

const emit = defineEmits(['generate-work-order']) // generate-work-order：通知 WorkOrderForm 用 BOM 行的物料作为产品，新建子工单

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
  quantity: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  quantity: [{ required: true, message: '预计使用量不能为空', trigger: 'blur' }]
})

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    workOrderId: undefined,
    itemId: undefined,
    quantity: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 打开 BOM 编辑弹窗 */
const openForm = (_type: string, row: any) => {
  resetForm()
  dialogVisible.value = true
  dialogTitle.value = '编辑 BOM 物料'
  formData.value = { ...row }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProWorkOrderBomVO
    await ProWorkOrderBomApi.updateWorkOrderBom(data)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    await getBomList()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getBomList()
})
</script>
