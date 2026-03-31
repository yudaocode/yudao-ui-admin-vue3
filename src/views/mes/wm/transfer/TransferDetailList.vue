<template>
  <div class="pl-60px pr-20px py-10px">
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="移入仓库" align="center" prop="toWarehouseName" min-width="100" />
      <el-table-column label="移入库区" align="center" prop="toLocationName" min-width="100" />
      <el-table-column label="移入库位" align="center" prop="toAreaName" min-width="100" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column
        v-if="isStock"
        label="操作"
        align="center"
        width="120"
        fixed="right"
      >
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

defineOptions({ name: 'TransferDetailList' })

const props = defineProps<{
  transferId: number
  lineId: number
  itemId: number
  lineQuantity?: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isStock = computed(() => props.formType === 'stock') // 是否为上架模式
const loading = ref(false) // 列表的加载中
const list = ref<WmTransferDetailVO[]>([]) // 明细列表

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmTransferDetailApi.getTransferDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}

defineExpose({ getList })

/** 删除调拨明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmTransferDetailApi.deleteTransferDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>
