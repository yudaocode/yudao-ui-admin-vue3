<!-- 待回款提醒 -->
<template>
  <ContentWrap>
    <div class="pb-5 text-xl">待回款提醒</div>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="合同状态" prop="remindType">
        <el-select
          v-model="queryParams.remindType"
          class="!w-240px"
          placeholder="状态"
          @change="handleQuery"
        >
          <el-option
            v-for="(option, index) in RECEIVABLE_REMIND_TYPE"
            :label="option.label"
            :value="option.value"
            :key="index"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column align="center" fixed="left" label="客户名称" prop="customerName" width="150">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openCustomerDetail(scope.row.customerId)"
          >
            {{ scope.row.customerName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="合同编号" prop="contractNo" width="200px" />
      <el-table-column align="center" label="期数" prop="period">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.period }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="计划回款金额（元）"
        prop="price"
        width="160"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="计划回款日期"
        prop="returnTime"
        width="180px"
      />
      <el-table-column align="center" label="提前几天提醒" prop="remindDays" width="150" />
      <el-table-column
        align="center"
        label="提醒日期"
        prop="remindTime"
        width="180px"
        :formatter="dateFormatter2"
      />
      <el-table-column align="center" label="回款方式" prop="returnType" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="备注" prop="remark" />
      <el-table-column label="负责人" prop="ownerUserName" width="120" />
      <el-table-column
        align="center"
        label="实际回款金额（元）"
        prop="receivable.price"
        width="160"
      >
        <template #default="scope">
          <el-text v-if="scope.row.receivable">
            {{ erpPriceInputFormatter(scope.row.receivable.price) }}
          </el-text>
          <el-text v-else>{{ erpPriceInputFormatter(0) }}</el-text>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="实际回款日期"
        prop="receivable.returnTime"
        width="180px"
        :formatter="dateFormatter2"
      />
      <el-table-column
        align="center"
        label="实际回款金额（元）"
        prop="receivable.price"
        width="160"
      >
        <template #default="scope">
          <el-text v-if="scope.row.receivable">
            {{ erpPriceInputFormatter(scope.row.price - scope.row.receivable.price) }}
          </el-text>
          <el-text v-else>{{ erpPriceInputFormatter(scope.row.price) }}</el-text>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="更新时间"
        prop="updateTime"
        width="180px"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" label="创建人" prop="creatorName" width="100px" />
      <el-table-column align="center" fixed="right" label="操作" width="180px">
        <template #default="scope">
          <el-button
            v-hasPermi="['crm:receivable:create']"
            link
            type="success"
            @click="openReceivableForm(scope.row)"
            :disabled="scope.row.receivableId"
          >
            创建回款
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ReceivableForm ref="receivableFormRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import { RECEIVABLE_REMIND_TYPE } from './common'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'
import ReceivableForm from '@/views/crm/receivable/ReceivableForm.vue'

defineOptions({ name: 'ReceivablePlanRemindList' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  remindType: 1
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReceivablePlanApi.getReceivablePlanPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 创建回款操作 */
const receivableFormRef = ref()
const openReceivableForm = (row: ReceivablePlanApi.ReceivablePlanVO) => {
  receivableFormRef.value.open('create', undefined, row)
}

/** 打开详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmReceivablePlanDetail', params: { id } })
}

/** 打开客户详情 */
const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 激活时 */
onActivated(async () => {
  await getList()
})

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
