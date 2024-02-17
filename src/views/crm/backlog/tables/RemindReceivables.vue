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
      <!--<el-table-column label="ID" align="center" prop="id" />-->
      <el-table-column label="客户名称" align="center" prop="customerId" width="150px" />
      <el-table-column label="合同名称" align="center" prop="contractId" width="150px" />
      <el-table-column label="期数" align="center" prop="period" />
      <el-table-column label="计划回款" align="center" prop="price" />
      <el-table-column
        label="计划回款日期"
        align="center"
        prop="returnTime"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="提前几天提醒" align="center" prop="remindDays" />
      <el-table-column label="完成状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="审批状态" align="center" prop="checkStatus" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="scope.row.checkStatus" />
        </template>
      </el-table-column>
      <!--<el-table-column label="工作流编号" align="center" prop="processInstanceId" />-->
      <el-table-column prop="ownerUserId" label="负责人" width="120">
        <template #default="scope">
          {{ userList.find((user) => user.id === scope.row.ownerUserId)?.nickname }}
        </template>
      </el-table-column>
      <el-table-column label="显示顺序" align="center" prop="sort" />
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

<script setup lang="ts" name="RemindReceivables">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import * as UserApi from '@/api/system/user'
import { RECEIVABLE_REMIND_TYPE } from './common'

defineOptions({ name: 'ReceivablePlan' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
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

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>

<style scoped></style>
