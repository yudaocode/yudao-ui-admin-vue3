<!-- MES 生产工单 BOM 子组件 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px" v-if="!disabled">
      <el-button type="primary" plain @click="openBomForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加物料
      </el-button>
    </el-row>
    <!-- BOM 列表 -->
    <el-table v-loading="loading" :data="bomList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="BOM 物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="BOM 物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <!-- TODO @AI：物料/名称，增加该类； -->
      <el-table-column label="预计使用量" align="center" prop="quantity" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="130" v-if="!disabled">
        <template #default="scope">
          <el-button link type="primary" @click="openBomForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDeleteBom(scope.row.id)">删除</el-button>
          <!-- TODO @AI：生成订单 -->
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

    <!-- BOM 表单弹窗 -->
    <!-- TODO @AI：拆成 List 和 Form 两个 -->
    <!-- TODO @芋艿：这块暂时还没测试和 review； -->
    <Dialog :title="bomDialogTitle" v-model="bomDialogVisible" width="600px">
      <el-form
        ref="bomFormRef"
        :model="bomFormData"
        :rules="bomFormRules"
        label-width="100px"
        v-loading="bomFormLoading"
      >
        <el-form-item label="物料" prop="itemId">
          <MdItemSelect v-model="bomFormData.itemId" @change="handleBomItemChange" />
        </el-form-item>
        <el-form-item label="单位" prop="unitMeasureId">
          <MdUnitMeasureSelect v-model="bomFormData.unitMeasureId" />
        </el-form-item>
        <el-form-item label="预计使用量" prop="quantity">
          <el-input-number
            v-model="bomFormData.quantity"
            :min="0"
            :precision="2"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="bomFormData.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitBomForm" type="primary" :disabled="bomFormLoading">确 定</el-button>
        <el-button @click="bomDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ProWorkOrderBomApi, ProWorkOrderBomVO } from '@/api/mes/pro/workorder/bom'
import { MdItemVO } from '@/api/mes/md/item'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdUnitMeasureSelect from '@/views/mes/md/unitmeasure/components/MdUnitMeasureSelect.vue'

defineOptions({ name: 'WorkOrderBom' })

const props = defineProps<{
  workOrderId: number
  disabled?: boolean
}>()

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

/** 删除 BOM */
const handleDeleteBom = async (id: number) => {
  try {
    await message.delConfirm()
    await ProWorkOrderBomApi.deleteWorkOrderBom(id)
    message.success(t('common.delSuccess'))
    await getBomList()
  } catch {}
}

// ==================== BOM 表单 ====================
const bomDialogVisible = ref(false)
const bomDialogTitle = ref('')
const bomFormLoading = ref(false)
const bomFormType = ref('')
const bomFormData = ref({
  id: undefined,
  workOrderId: undefined as number | undefined,
  itemId: undefined,
  unitMeasureId: undefined,
  quantity: undefined,
  remark: undefined
})
const bomFormRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  unitMeasureId: [{ required: true, message: '单位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '预计使用量不能为空', trigger: 'blur' }]
})
const bomFormRef = ref()

/** 打开 BOM 表单弹窗 */
const openBomForm = async (type: string, row?: any) => {
  bomDialogVisible.value = true
  bomDialogTitle.value = type === 'create' ? '添加物料' : '编辑物料'
  bomFormType.value = type
  // 重置表单
  bomFormData.value = {
    id: undefined,
    workOrderId: props.workOrderId,
    itemId: undefined,
    unitMeasureId: undefined,
    quantity: undefined,
    remark: undefined
  }
  // 编辑时设置数据
  if (row) {
    bomFormData.value = { ...row }
  }
}

/** 物料变更：自动填充单位 */
const handleBomItemChange = (item: MdItemVO | undefined) => {
  if (item?.unitMeasureId) {
    bomFormData.value.unitMeasureId = item.unitMeasureId
  }
}

/** 提交 BOM 表单 */
const submitBomForm = async () => {
  await bomFormRef.value.validate()
  bomFormLoading.value = true
  try {
    const data = bomFormData.value as unknown as ProWorkOrderBomVO
    if (bomFormType.value === 'create') {
      await ProWorkOrderBomApi.createWorkOrderBom(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProWorkOrderBomApi.updateWorkOrderBom(data)
      message.success(t('common.updateSuccess'))
    }
    bomDialogVisible.value = false
    await getBomList()
  } finally {
    bomFormLoading.value = false
  }
}

// ==================== 初始化 ====================
onMounted(async () => {
  await getBomList()
})
</script>
