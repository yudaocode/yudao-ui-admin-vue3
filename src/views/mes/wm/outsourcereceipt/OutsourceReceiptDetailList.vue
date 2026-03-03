<!-- MES 外协收货明细列表（展开行内嵌子组件） -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-button v-if="isUpdate" type="primary" plain size="small" @click="emit('edit-detail', undefined)" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加明细
    </el-button>
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="库位名称" align="center" prop="locationName" min-width="100" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column
        v-if="isUpdate"
        label="操作"
        align="center"
        width="120"
        fixed="right"
      >
        <template #default="scope">
          <el-button link type="primary" @click="emit('edit-detail', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { WmOutsourceReceiptDetailApi, WmOutsourceReceiptDetailVO } from '@/api/mes/wm/outsourcereceipt/detail'

defineOptions({ name: 'OutsourceReceiptDetailList' })

const props = defineProps<{
  receiptId: number
  lineId: number
  itemId: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n()
const message = useMessage()

const isUpdate = computed(() => ['create', 'update'].includes(props.formType))

const loading = ref(false)
const list = ref<WmOutsourceReceiptDetailVO[]>([])

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmOutsourceReceiptDetailApi.getOutsourceReceiptDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 删除收货明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmOutsourceReceiptDetailApi.deleteOutsourceReceiptDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>
