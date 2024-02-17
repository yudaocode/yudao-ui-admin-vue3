<!-- 待审核合同 -->
<template>
  <ContentWrap>
    <div class="pb-5 text-xl">待审核合同</div>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="合同状态" prop="auditStatus">
        <el-select
          v-model="queryParams.auditStatus"
          class="!w-240px"
          placeholder="状态"
          @change="handleQuery"
        >
          <el-option
            v-for="(option, index) in AUDIT_STATUS"
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
      <el-table-column align="center" fixed="left" label="合同编号" prop="no" width="130" />
      <el-table-column align="center" label="合同名称" prop="name" width="130" />
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
      <!-- TODO @puhui999：做了商机详情后，可以把这个超链接加上 -->
      <el-table-column align="center" label="商机名称" prop="businessName" width="130" />
      <el-table-column
        align="center"
        label="下单时间"
        prop="orderDate"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column
        align="center"
        label="合同金额"
        prop="price"
        width="130"
        :formatter="fenToYuanFormat"
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
            @click="openContactDetail(scope.row.contactId)"
          >
            {{ scope.row.contactName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="公司签约人" prop="signUserName" width="130" />
      <el-table-column align="center" label="备注" prop="remark" width="130" />
      <!-- TODO @puhui999：后续可加 【已收款金额】、【未收款金额】 -->
      <el-table-column align="center" label="负责人" prop="ownerUserName" width="120" />
      <el-table-column align="center" label="创建人" prop="creatorName" width="120" />
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
      <el-table-column align="center" fixed="right" label="合同状态" prop="auditStatus" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="scope.row.auditStatus" />
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

<script setup lang="ts" name="CheckContract">
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ContractApi from '@/api/crm/contract'
import { fenToYuanFormat } from '@/utils/formatter'
import { DICT_TYPE } from '@/utils/dict'
import { AUDIT_STATUS } from './common'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  auditStatus: 20
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

/** 打开客户详情 */
const { push } = useRouter() // 路由
const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 打开联系人详情 */
const openContactDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped></style>
