<!-- 待审核回款 -->
<template>
  <ContentWrap>
    <div class="pb-5 text-xl"> 待审核回款 </div>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
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
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="ID" align="center" prop="id" />
      <el-table-column label="回款编号" align="center" prop="no" />
      <!-- <el-table-column label="回款计划ID" align="center" prop="planId" />-->
      <el-table-column label="客户" align="center" prop="customerId" />
      <el-table-column label="合同" align="center" prop="contractId" />
      <el-table-column label="审批状态" align="center" prop="checkStatus" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="scope.row.checkStatus" />
        </template>
      </el-table-column>
      <!-- <el-table-column label="工作流编号" align="center" prop="processInstanceId" />-->
      <el-table-column
        label="回款日期"
        align="center"
        prop="returnTime"
        :formatter="dateFormatter2"
        width="150px"
      />
      <el-table-column label="回款方式" align="center" prop="returnType" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column label="回款金额(元)" align="center" prop="price" />
      <el-table-column label="负责人" align="center" prop="ownerUserId" />
      <el-table-column label="批次" align="center" prop="batchId" />
      <!--<el-table-column label="显示顺序" align="center" prop="sort" />-->
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts" name="CheckReceivables">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ReceivableApi from '@/api/crm/receivable'
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
    const data = await ReceivableApi.getReceivablePage(queryParams)
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

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped></style>
