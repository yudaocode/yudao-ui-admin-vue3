<!-- MES 生产工单 BOM 列表子组件 -->
<template>
  <div class="overflow-hidden">
    <!-- 操作按钮 -->
    <div v-if="isEditable" class="mb-10px">
      <el-button type="primary" plain @click="openForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加物料
      </el-button>
    </div>
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
        v-if="isEditable || isConfirmed"
      >
        <template #default="scope">
          <!-- 草稿状态：编辑、删除 -->
          <template v-if="isEditable">
            <el-button link type="primary" @click="openForm('update', scope.row)"> 编辑 </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row.id)"> 删除 </el-button>
          </template>
          <!-- 已确认 + 自行生产 + 产品类型 BOM 行：生成子工单 -->
          <el-button
            v-if="
              isConfirmed &&
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

    <!-- BOM 新增/编辑弹窗 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item v-if="bomFormType === 'create'" label="物料" prop="itemId">
          <MdItemSelect v-model="formData.itemId" />
        </el-form-item>
        <el-form-item v-else label="物料">
          <el-input :model-value="formData.itemName" disabled />
        </el-form-item>
        <el-form-item v-if="bomFormType === 'update'" label="单位">
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
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'WorkOrderBomList' })

const props = defineProps<{
  workOrderId: number
  workOrder: any
  formType: string
}>()

const emit = defineEmits(['generate-work-order'])

const message = useMessage()
const { t } = useI18n()

const isEditable = computed(
  () =>
    ['create', 'update'].includes(props.formType) &&
    props.workOrder.status === MesProWorkOrderStatusEnum.PREPARE
) // 是否编辑
const isConfirmed = computed(() => props.workOrder.status === MesProWorkOrderStatusEnum.CONFIRMED) // 是否确认

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

/** 删除 BOM */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProWorkOrderBomApi.deleteWorkOrderBom(id)
    message.success(t('common.delSuccess'))
    await getBomList()
  } catch {}
}

// ==================== BOM 新增/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
// TODO @AI：这里的 create | update 不用枚举，简洁一点；
const bomFormType = ref<'create' | 'update'>('update')
const formRef = ref()
const formData = ref({
  id: undefined as number | undefined,
  workOrderId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  itemName: undefined as string | undefined,
  unitMeasureName: undefined as string | undefined,
  quantity: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '预计使用量不能为空', trigger: 'blur' }]
})

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    workOrderId: undefined,
    itemId: undefined,
    itemName: undefined,
    unitMeasureName: undefined,
    quantity: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 打开 BOM 弹窗 */
// TODO @AI：这里的 create | update 不用写，简洁一点；
const openForm = (type: 'create' | 'update', row?: any) => {
  resetForm()
  bomFormType.value = type
  dialogVisible.value = true
  if (type === 'create') {
    // TODO @AI：dialogTitle 通过 compute 计算
    dialogTitle.value = '添加 BOM 物料'
    formData.value.workOrderId = props.workOrderId
  } else {
    dialogTitle.value = '编辑 BOM 物料'
    formData.value = { ...row }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProWorkOrderBomVO
    if (bomFormType.value === 'create') {
      await ProWorkOrderBomApi.createWorkOrderBom(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProWorkOrderBomApi.updateWorkOrderBom(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getBomList()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getBomList()
})
</script>
