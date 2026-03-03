<!-- MES 外协发料单明细列表（展开行内嵌子组件） -->
<!-- TODO @芋艿：未 review -->
<template>
  <div class="pl-60px pr-20px py-10px">
    <el-table v-loading="loading" :data="list" border size="small">
      <el-table-column label="仓库名称" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区名称" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位名称" align="center" prop="areaName" min-width="100" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column v-if="isUpdate" label="操作" align="center" width="120" fixed="right">
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
  WmOutsourceIssueDetailApi,
  WmOutsourceIssueDetailVO
} from '@/api/mes/wm/outsourceissue/detail'

defineOptions({ name: 'OutsourceIssueDetailList' })

const props = defineProps<{
  issueId: number
  lineId: number
  itemId: number
  formType: string
}>()

const emit = defineEmits(['edit-detail'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isUpdate = computed(() => ['create', 'update'].includes(props.formType)) // 是否为编辑模式

const loading = ref(false) // 列表的加载中
const list = ref<WmOutsourceIssueDetailVO[]>([]) // 明细列表

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmOutsourceIssueDetailApi.getOutsourceIssueDetailListByLineId(props.lineId)
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 删除发料明细 */
const handleDelete = async (detailId: number) => {
  try {
    await message.delConfirm()
    await WmOutsourceIssueDetailApi.deleteOutsourceIssueDetail(detailId)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化：延迟加载，展开时才触发 */
onMounted(() => {
  getList()
})
</script>
