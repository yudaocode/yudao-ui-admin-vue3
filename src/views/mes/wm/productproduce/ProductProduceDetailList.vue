<!-- MES 生产入库明细列表（展开行内嵌子组件） -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="仓库名称" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区名称" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位名称" align="center" prop="areaName" min-width="100" />
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
import {
  WmProductProduceDetailApi,
  WmProductProduceDetailVO
} from '@/api/mes/wm/productproduce/detail'

defineOptions({ name: 'ProductProduceDetailList' })

const props = defineProps<{
  produceId: number
  lineId: number
  itemId: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isUpdate = computed(() => ['create', 'update'].includes(props.formType)) // 是否为编辑模式

const loading = ref(false) // 列表的加载中
const list = ref<WmProductProduceDetailVO[]>([]) // 明细列表

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmProductProduceDetailApi.getProductProduceDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 删除入库明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmProductProduceDetailApi.deleteProductProduceDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>
