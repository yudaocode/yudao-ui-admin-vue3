<!-- MES 采购入库上架明细列表（展开行内嵌子组件） -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="仓库名称" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区名称" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位名称" align="center" prop="areaName" min-width="100" />
      <el-table-column label="上架数量" align="center" prop="quantity" width="100" />
      <el-table-column
        v-if="props.formType === 'shelving'"
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
import { WmItemReceiptDetailApi, WmItemReceiptDetailVO } from '@/api/mes/wm/itemreceipt/detail'

defineOptions({ name: 'ItemReceiptDetailList' })

const props = defineProps<{
  receiptId: number
  lineId: number
  itemId: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// ==================== 列表 ====================
const loading = ref(false) // 列表的加载中
const list = ref<WmItemReceiptDetailVO[]>([]) // 明细列表

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmItemReceiptDetailApi.getItemReceiptDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 删除上架明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmItemReceiptDetailApi.deleteItemReceiptDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>
