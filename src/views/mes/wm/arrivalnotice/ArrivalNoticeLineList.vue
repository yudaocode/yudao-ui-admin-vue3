<!-- MES 到货通知单行列表子组件 -->
<template>
  <div>
    <el-button type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="到货数量" align="center" prop="arrivalQuantity" width="100" />
      <el-table-column label="是否检验" align="center" prop="iqcCheckFlag" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.iqcCheckFlag" />
        </template>
      </el-table-column>
      <el-table-column label="合格数量" align="center" prop="qualifiedQuantity" width="100" />
      <!-- TODO @芋艿【不要删除】：后续需要怎么弄 -->
      <el-table-column label="检验单号" align="center" prop="iqcCode" min-width="140" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="120">
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

  <ArrivalNoticeLineForm ref="formRef" @success="getList" :noticeId="noticeId" />
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { WmArrivalNoticeLineApi, WmArrivalNoticeLineVO } from '@/api/mes/wm/arrivalnotice/line'
import ArrivalNoticeLineForm from './line/ArrivalNoticeLineForm.vue'

defineOptions({ name: 'ArrivalNoticeLineList' })

const props = defineProps<{
  noticeId: number
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<WmArrivalNoticeLineVO[]>([]) // 行列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  noticeId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.noticeId = props.noticeId
    const data = await WmArrivalNoticeLineApi.getArrivalNoticeLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 新增/修改 */
const formRef = ref() // 表单弹窗
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmArrivalNoticeLineApi.deleteArrivalNoticeLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
