<!-- MES 领料出库明细列表（展开行内嵌子组件） -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-button
      v-if="canPick"
      type="primary"
      size="small"
      @click="handlePick"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加拣货
    </el-button>
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位" align="center" prop="areaName" min-width="100" />
      <el-table-column label="拣货数量" align="center" prop="quantity" width="100" />
      <el-table-column
        v-if="canPick"
        label="操作"
        align="center"
        width="120"
        fixed="right"
      >
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 拣货对话框 -->
  <el-dialog v-model="dialogVisible" title="添加拣货" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="库存位置" prop="materialStockId">
        <el-input
          v-model="formData.warehouseName"
          placeholder="请选择库存位置"
          readonly
          @click="handleSelectStock"
          class="cursor-pointer"
        >
          <template #append>
            <el-button @click="handleSelectStock">
              <Icon icon="ep:search" />
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="批次号">
        <el-input v-model="formData.batchCode" disabled />
      </el-form-item>
      <el-form-item label="库区">
        <el-input v-model="formData.locationName" disabled />
      </el-form-item>
      <el-form-item label="库位">
        <el-input v-model="formData.areaName" disabled />
      </el-form-item>
      <el-form-item label="可用数量">
        <el-input v-model="formData.availableQuantity" disabled />
      </el-form-item>
      <el-form-item label="拣货数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :min="0"
          :max="formData.availableQuantity"
          :precision="2"
          class="!w-full"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>

  <!-- 库存选择器 -->
  <WmMaterialStockSelect ref="stockSelectRef" @select="handleStockSelected" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { WmProductionIssueDetailApi, WmProductionIssueDetailVO } from '@/api/mes/wm/productionissue/detail'
import WmMaterialStockSelect from '@/views/mes/wm/materialstock/components/WmMaterialStockSelect.vue'

defineOptions({ name: 'ProductionIssueDetailList' })

const props = defineProps<{
  issueId: number
  lineId: number
  itemId: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const list = ref<WmProductionIssueDetailVO[]>([])
const dialogVisible = ref(false)
const formRef = ref()
const stockSelectRef = ref()

const canPick = computed(() => props.formType === 'stock') // 拣货模式

const formData = reactive<WmProductionIssueDetailVO & { availableQuantity?: number }>({
  issueId: props.issueId,
  lineId: props.lineId,
  itemId: props.itemId,
  materialStockId: 0,
  quantity: 0,
  batchId: undefined,
  batchCode: '',
  warehouseId: 0,
  warehouseName: '',
  locationId: undefined,
  locationName: '',
  areaId: undefined,
  areaName: '',
  remark: '',
  availableQuantity: 0
})

const formRules = {
  materialStockId: [{ required: true, message: '请选择库存位置', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入拣货数量', trigger: 'blur' }]
}

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmProductionIssueDetailApi.getDetailPage({
      pageNo: 1,
      pageSize: 100,
      lineId: props.lineId
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 添加拣货 */
const handlePick = () => {
  resetForm()
  dialogVisible.value = true
}

/** 选择库存 */
const handleSelectStock = () => {
  stockSelectRef.value.open(props.itemId)
}

/** 库存选择回调 */
const handleStockSelected = (stock: any) => {
  formData.materialStockId = stock.materialStockId
  formData.batchId = stock.batchId
  formData.batchCode = stock.batchCode
  formData.warehouseId = stock.warehouseId
  formData.warehouseName = stock.warehouseName
  formData.locationId = stock.locationId
  formData.locationName = stock.locationName
  formData.areaId = stock.areaId
  formData.areaName = stock.areaName
  formData.availableQuantity = stock.availableQuantity
}

/** 确认添加 */
const handleConfirm = async () => {
  await formRef.value.validate()
  try {
    const data: WmProductionIssueDetailVO = {
      issueId: props.issueId,
      lineId: props.lineId,
      itemId: props.itemId,
      materialStockId: formData.materialStockId,
      quantity: formData.quantity,
      batchId: formData.batchId,
      batchCode: formData.batchCode,
      warehouseId: formData.warehouseId,
      warehouseName: formData.warehouseName,
      locationId: formData.locationId,
      locationName: formData.locationName,
      areaId: formData.areaId,
      areaName: formData.areaName,
      remark: formData.remark
    }
    await WmProductionIssueDetailApi.createDetail(data)
    message.success('添加成功')
    dialogVisible.value = false
    await getList()
  } catch {}
}

/** 删除明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmProductionIssueDetailApi.deleteDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 重置表单 */
const resetForm = () => {
  Object.assign(formData, {
    issueId: props.issueId,
    lineId: props.lineId,
    itemId: props.itemId,
    materialStockId: 0,
    quantity: 0,
    batchId: undefined,
    batchCode: '',
    warehouseId: 0,
    warehouseName: '',
    locationId: undefined,
    locationName: '',
    areaId: undefined,
    areaName: '',
    remark: '',
    availableQuantity: 0
  })
  formRef.value?.clearValidate()
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
