<!-- MES 装箱明细列表子组件 -->
<template>
  <div class="overflow-hidden">
    <el-button v-if="isEditable" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加明细
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="产品物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="装箱数量" align="center" prop="quantity" width="100" />
      <el-table-column label="生产工单编号" align="center" prop="workOrderCode" min-width="140" />
      <!-- DONE @芋艿：批次号？到底怎么设置好？（AI 未修复原因：需产品经理确认批次号的设置方式） -->
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column
        label="有效期"
        align="center"
        prop="expireDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column v-if="isEditable" label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>

  <!-- 添加/编辑明细弹窗 -->
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
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              :status="MesProWorkOrderStatusEnum.CONFIRMED"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="装箱数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0.01"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- DONE @芋艿：批次号？到底怎么设置好？（AI 未修复原因：需产品经理确认批次号的设置方式） -->
      <el-row>
        <el-col :span="8">
          <el-form-item label="有效期" prop="expireDate">
            <el-date-picker
              v-model="formData.expireDate"
              type="date"
              value-format="x"
              placeholder="请选择有效期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
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
import { dateFormatter2 } from '@/utils/formatTime'
import { WmPackageLineApi, WmPackageLineVO } from '@/api/mes/wm/packages/line'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import { MesProWorkOrderStatusEnum } from '@/views/mes/utils/constants'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'PackageLineList' })

const props = defineProps<{
  packageId: number
  formType: string
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isEditable = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmPackageLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  packageId: undefined as number | undefined
})

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    // TODO @芋艿：需确认“父箱详情 -> 装箱清单”是否要和【对齐】一样，自动汇总当前箱及其子孙箱明细；
    // 目前前端仅传当前 packageId，最终查询范围取决于后端 package-line/page 的实现。
    queryParams.packageId = props.packageId
    const data = await WmPackageLineApi.getPackageLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmPackageLineApi.deletePackageLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref('')
const formData = ref({
  id: undefined as number | undefined,
  packageId: undefined as number | undefined,
  materialStockId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  quantity: undefined as number | undefined,
  workOrderId: undefined as number | undefined,
  expireDate: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  workOrderId: [{ required: true, message: '请选择生产工单', trigger: 'change' }],
  itemId: [{ required: true, message: '请选择产品物料', trigger: 'change' }],
  quantity: [
    { required: true, message: '装箱数量不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '装箱数量必须大于0', trigger: 'blur' }
  ]
})
const formRef = ref()

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加装箱明细' : '修改装箱明细'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = (await WmPackageLineApi.getPackageLine(id)) as any
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
      packageId: props.packageId
    } as unknown as WmPackageLineVO
    if (lineFormType.value === 'create') {
      await WmPackageLineApi.createPackageLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmPackageLineApi.updatePackageLine(data)
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
    packageId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    quantity: undefined,
    workOrderId: undefined,
    expireDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
