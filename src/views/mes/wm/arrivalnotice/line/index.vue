<template>
  <ContentWrap>
    <el-button @click="goBack" class="mb-10px">
      <Icon icon="ep:arrow-left" class="mr-5px" /> 返回通知单列表
    </el-button>
  </ContentWrap>

  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-arrival-notice:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" min-width="80" />
      <el-table-column label="到货数量" align="center" prop="arrivalQuantity" min-width="100" />
      <el-table-column label="是否检验" align="center" prop="iqcCheckFlag" min-width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.iqcCheckFlag" />
        </template>
      </el-table-column>
      <el-table-column label="合格数量" align="center" prop="qualifiedQuantity" min-width="100" />
      <el-table-column label="检验单号" align="center" prop="iqcCode" min-width="140" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <ArrivalNoticeLineForm ref="formRef" @success="getList" :noticeId="noticeId" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { WmArrivalNoticeLineApi, WmArrivalNoticeLineVO } from '@/api/mes/wm/arrivalnotice/line'
import ArrivalNoticeLineForm from './ArrivalNoticeLineForm.vue'

defineOptions({ name: 'MesWmArrivalNoticeLine' })

const message = useMessage()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const noticeId = Number(route.query.noticeId)
const loading = ref(true)
const list = ref<WmArrivalNoticeLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  noticeId
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmArrivalNoticeLineApi.getArrivalNoticeLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增/修改 */
const formRef = ref()
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

/** 返回 */
const goBack = () => {
  router.push({ name: 'MesWmArrivalNotice' })
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
