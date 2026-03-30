<!-- MES 领料出库拣货明细列表（展开行内嵌子组件） -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="仓库名称" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区名称" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位名称" align="center" prop="areaName" min-width="100" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column v-if="isStock" label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="emit('edit-detail', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          <!-- TODO @芋艿：【保留】标签打印 -->
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { WmProductIssueDetailApi, WmProductIssueDetailVO } from '@/api/mes/wm/productissue/detail'

defineOptions({ name: 'ProductIssueDetailList' })

const props = defineProps<{
  issueId: number
  lineId: number
  itemId: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isStock = computed(() => props.formType === 'stock') // 是否为拣货模式

const loading = ref(false) // 列表的加载中
const list = ref<WmProductIssueDetailVO[]>([]) // 明细列表

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmProductIssueDetailApi.getProductIssueDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}

/** 删除拣货明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmProductIssueDetailApi.deleteProductIssueDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
defineExpose({ getList })
</script>
