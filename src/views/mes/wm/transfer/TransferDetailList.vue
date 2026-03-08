<template>
  <div class="pl-60px pr-20px py-10px">
    <!-- TODO @AI：不用这个。。。 -->
    <div v-if="props.formType === 'stock'" class="mb-10px flex justify-between items-center">
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        行数量：{{ props.lineQuantity || 0 }}，已分配：{{ allocatedQuantity }}，剩余：{{ remainingQuantity }}
      </span>
    </div>
    <el-table v-loading="loading" :data="list" border size="small">
      <!-- TODO @AI：仓库名称、库区名称、库位名称 -->
      <el-table-column label="移入仓库" align="center" prop="toWarehouseName" min-width="100" />
      <el-table-column label="移入库区" align="center" prop="toLocationName" min-width="100" />
      <el-table-column label="移入库位" align="center" prop="toAreaName" min-width="100" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column v-if="props.formType === 'stock'" label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="emit('edit-detail', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { WmTransferDetailApi, WmTransferDetailVO } from '@/api/mes/wm/transfer/detail'

// TODO @AI：参考别的 detaillist 补全下注释；

defineOptions({ name: 'TransferDetailList' })

const props = defineProps<{
  transferId: number
  lineId: number
  itemId: number
  lineQuantity?: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const list = ref<WmTransferDetailVO[]>([])

const allocatedQuantity = computed(() => {
  return list.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
})
const remainingQuantity = computed(() => {
  return Number(props.lineQuantity || 0) - allocatedQuantity.value
})

const getList = async () => {
  loading.value = true
  try {
    list.value = await WmTransferDetailApi.getTransferDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}

defineExpose({ getList })

const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmTransferDetailApi.deleteTransferDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
