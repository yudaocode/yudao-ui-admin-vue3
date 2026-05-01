<!-- MES 子箱列表子组件 -->
<template>
  <div class="overflow-hidden">
    <el-button v-if="isEditable" type="primary" plain @click="handleAddChild" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加子箱
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="装箱单编号" align="center" prop="code" min-width="160" fixed="left">
        <template #default="scope">
          <span>{{ scope.row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="装箱日期"
        align="center"
        prop="packageDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" min-width="140" />
      <el-table-column label="发票编号" align="center" prop="invoiceCode" min-width="120" />
      <el-table-column label="客户编码" align="center" prop="clientCode" min-width="100" />
      <el-table-column label="客户名称" align="center" prop="clientName" min-width="120" />
      <el-table-column label="箱长度" align="center" prop="length" width="80" />
      <el-table-column label="箱宽度" align="center" prop="width" width="80" />
      <el-table-column label="箱高度" align="center" prop="height" width="80" />
      <el-table-column label="尺寸单位" align="center" prop="sizeUnitName" width="90" />
      <el-table-column label="净重" align="center" prop="netWeight" width="80" />
      <el-table-column label="毛重" align="center" prop="grossWeight" width="80" />
      <el-table-column label="重量单位" align="center" prop="weightUnitName" width="90" />
      <el-table-column label="检查员" align="center" prop="inspectorName" min-width="100" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column v-if="isEditable" label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="danger" @click="handleRemoveChild(scope.row.id)"> 移除 </el-button>
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

  <!-- 添加子箱：直接打开装箱单选择弹窗（单选） -->
  <WmPackageSelectDialog
    ref="dialogRef"
    :multiple="false"
    :exclude-id="props.packageId"
    childable-only
    @selected="handleSelected"
  />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { WmPackageApi, WmPackageVO } from '@/api/mes/wm/packages'
import WmPackageSelectDialog from './components/WmPackageSelectDialog.vue'

defineOptions({ name: 'SubPackageList' })

const props = defineProps<{
  packageId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isEditable = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 子箱列表 ====================
const loading = ref(false)
const list = ref<WmPackageVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  parentId: undefined as number | undefined
})

/** 查询子箱列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.parentId = props.packageId
    const data = await WmPackageApi.getPackagePage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

/** 移除子箱：将子箱的 parentId 清空 */
const handleRemoveChild = async (childId: number) => {
  try {
    await message.confirm('确认将该装箱单从子箱列表中移除？')
    await WmPackageApi.removeChildPackage(childId)
    message.success('移除成功')
    await getList()
  } catch {}
}

// ==================== 添加子箱 ====================
const dialogRef = ref()

/** 打开装箱单选择弹窗 */
const handleAddChild = () => {
  dialogRef.value.open()
}

/** 选中回调：将选中的装箱单添加为子箱 */
const handleSelected = async (rows: WmPackageVO[]) => {
  if (!rows || rows.length === 0) {
    return
  }
  try {
    await WmPackageApi.addChildPackage(props.packageId, rows[0].id)
    message.success(t('common.createSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
