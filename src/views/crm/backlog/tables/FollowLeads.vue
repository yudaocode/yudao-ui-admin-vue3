<!-- TODO: dhb52 待Clue页面更新后同步更新 -->
<!-- WHERE transformStatus = 0 AND followUpStatus = ? -->
<template>
  <ContentWrap>
    <div class="pb-5 text-xl">分配给我的线索</div>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="状态" prop="followUpStatus">
        <el-select
          v-model="queryParams.followUpStatus"
          class="!w-240px"
          placeholder="状态"
          @change="handleQuery"
        >
          <el-option
            v-for="(option, index) in FOLLOWUP_STATUS"
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
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="转化状态" align="center" prop="transformStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.transformStatus" />
        </template>
      </el-table-column>
      <el-table-column label="跟进状态" align="center" prop="followUpStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.followUpStatus" />
        </template>
      </el-table-column>
      <el-table-column label="线索名称" align="center" prop="name" />
      <el-table-column label="客户id" align="center" prop="customerId" />
      <el-table-column
        label="下次联系时间"
        align="center"
        prop="contactNextTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="电话" align="center" prop="telephone" />
      <el-table-column label="手机号" align="center" prop="mobile" />
      <el-table-column label="地址" align="center" prop="address" />
      <el-table-column label="负责人" align="center" prop="ownerUserId" />
      <el-table-column
        label="最后跟进时间"
        align="center"
        prop="contactLastTime"
        :formatter="dateFormatter"
        width="180px"
      />
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

<script setup lang="ts" name="FollowLeads">
import * as ClueApi from '@/api/crm/clue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { FOLLOWUP_STATUS } from './common'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  followUpStatus: false,
  transformStatus: false // 固定为【未转移】
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ClueApi.getCluePage(queryParams)
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
