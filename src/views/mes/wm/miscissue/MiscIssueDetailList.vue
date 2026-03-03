<!-- MES 杂项出库明细列表（展开行内嵌子组件） -->
<!-- TODO @AI：删除掉； -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-button
      v-if="isUpdate"
      type="primary"
      plain
      size="small"
      @click="openForm('create')"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加明细
    </el-button>
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="仓库名称" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区名称" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位名称" align="center" prop="areaName" min-width="100" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column v-if="isUpdate" label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 添加/编辑明细弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="仓库" prop="warehouseId">
        <WmWarehouseSelect
          v-model="formData.warehouseId"
          @change="handleWarehouseChange"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="库区" prop="locationId">
        <WmWarehouseLocationSelect
          v-model="formData.locationId"
          :warehouse-id="formData.warehouseId"
          @change="handleLocationChange"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="库位" prop="areaId">
        <WmWarehouseAreaSelect
          v-model="formData.areaId"
          :location-id="formData.locationId"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :precision="2"
          :min="0.01"
          controls-position="right"
          class="!w-1/1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmMiscIssueDetailApi, WmMiscIssueDetailVO } from '@/api/mes/wm/miscissue/detail'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'MiscIssueDetailList' })

const props = defineProps<{
  issueId: number
  lineId: number
  itemId: number
  formType: string
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isUpdate = computed(() => ['create', 'update'].includes(props.formType)) // 是否为编辑模式

const loading = ref(false) // 列表的加载中
const list = ref<WmMiscIssueDetailVO[]>([]) // 明细列表

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmMiscIssueDetailApi.getMiscIssueDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 删除出库明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmMiscIssueDetailApi.deleteMiscIssueDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const detailFormType = ref('') // 明细表单的类型
const formData = ref({
  id: undefined,
  lineId: undefined as number | undefined,
  issueId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  quantity: undefined
})
const formRules = reactive({
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }],
  locationId: [{ required: true, message: '库区不能为空', trigger: 'change' }],
  areaId: [{ required: true, message: '库位不能为空', trigger: 'change' }],
  quantity: [
    { required: true, message: '数量不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '数量必须大于等于0.01', trigger: 'blur' }
  ]
})
const formRef = ref() // 表单 Ref

/** 仓库变化时，清空库区和库位 */
const handleWarehouseChange = () => {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
}

/** 库区变化时，清空库位 */
const handleLocationChange = () => {
  formData.value.areaId = undefined
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加出库明细' : '修改出库明细'
  detailFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmMiscIssueDetailApi.getMiscIssueDetail(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      lineId: props.lineId,
      issueId: props.issueId,
      itemId: props.itemId
    } as unknown as WmMiscIssueDetailVO
    if (detailFormType.value === 'create') {
      await WmMiscIssueDetailApi.createMiscIssueDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmMiscIssueDetailApi.updateMiscIssueDetail(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    lineId: undefined,
    issueId: undefined,
    itemId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    quantity: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>
