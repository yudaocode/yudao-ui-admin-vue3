<!-- 即将到期的合同 -->
<template>
  <ContentWrap>
    <div class="pb-5 text-xl"> 即将到期的合同 </div>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="到期状态" prop="expiryType">
        <el-select
          v-model="queryParams.expiryType"
          class="!w-240px"
          placeholder="状态"
          @change="handleQuery"
        >
          <el-option
            v-for="(option, index) in CONTRACT_EXPIRY_TYPE"
            :label="option.label"
            :value="option.value"
            :key="index"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" fixed="left" label="合同编号" prop="no" width="180" />
      <el-table-column align="center" fixed="left" label="合同名称" prop="name" width="160">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户名称" prop="customerName" width="120">
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
      <el-table-column align="center" label="商机名称" prop="businessName" width="130">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openBusinessDetail(scope.row.businessId)"
          >
            {{ scope.row.businessName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="合同金额（元）"
        prop="totalPrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        align="center"
        label="下单时间"
        prop="orderDate"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column
        align="center"
        label="合同开始时间"
        prop="startTime"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column
        align="center"
        label="合同结束时间"
        prop="endTime"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column align="center" label="客户签约人" prop="contactName" width="130">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openContactDetail(scope.row.signContactId)"
          >
            {{ scope.row.signContactName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="公司签约人" prop="signUserName" width="130" />
      <el-table-column align="center" label="备注" prop="remark" width="200" />
      <el-table-column
        align="center"
        label="已回款金额（元）"
        prop="totalReceivablePrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        align="center"
        label="未回款金额（元）"
        prop="totalReceivablePrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      >
        <template #default="scope">
          {{ erpPriceInputFormatter(scope.row.totalPrice - scope.row.totalReceivablePrice) }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="最后跟进时间"
        prop="contactLastTime"
        width="180px"
      />
      <el-table-column align="center" label="负责人" prop="ownerUserName" width="120" />
      <el-table-column align="center" label="所属部门" prop="ownerUserDeptName" width="100px" />
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
      <el-table-column align="center" label="创建人" prop="creatorName" width="120" />
      <el-table-column align="center" fixed="right" label="合同状态" prop="auditStatus" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="scope.row.auditStatus" />
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="90">
        <template #default="scope">
          <el-button
            link
            v-hasPermi="['crm:contract:update']"
            type="primary"
            @click="handleProcessDetail(scope.row)"
          >
            查看审批
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts" name="EndContract">
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ContractApi from '@/api/crm/contract'
import { fenToYuanFormat } from '@/utils/formatter'
import { DICT_TYPE } from '@/utils/dict'
import { CONTRACT_EXPIRY_TYPE } from './common'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  sceneType: '1', // 自己负责的
  expiryType: 1
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ContractApi.getContractPage(queryParams)
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

/** 查看审批 */
const handleProcessDetail = (row: ContractApi.ContractVO) => {
  push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
}

/** 打开合同详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmContractDetail', params: { id } })
}

/** 打开客户详情 */
const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 打开联系人详情 */
const openContactDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}

/** 打开商机详情 */
const openBusinessDetail = (id: number) => {
  push({ name: 'CrmBusinessDetail', params: { id } })
}

/** 激活时 */
onActivated(async () => {
  await getList()
})

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
