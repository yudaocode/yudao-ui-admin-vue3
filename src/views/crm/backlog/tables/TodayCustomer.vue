<template>
  <ContentWrap>
    <div class="pb-5 text-xl"> 今日需联系客户 </div>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="状态" prop="contactStatus">
        <el-select
          v-model="queryParams.contactStatus"
          class="!w-240px"
          placeholder="状态"
          @change="handleQuery"
        >
          <el-option
            v-for="(option, index) in CONTACT_STATUS"
            :label="option.label"
            :value="option.value"
            :key="index"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="归属" prop="sceneType">
        <el-select
          v-model="queryParams.sceneType"
          class="!w-240px"
          placeholder="归属"
          @change="handleQuery"
        >
          <el-option
            v-for="(option, index) in SCENE_TYPES"
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
      <el-table-column align="center" label="编号" fixed="left" prop="id" />
      <el-table-column align="center" label="客户名称" fixed="left" prop="name" width="160">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="手机" prop="mobile" width="120" />
      <el-table-column align="center" label="电话" prop="telephone" width="120" />
      <el-table-column align="center" label="客户来源" prop="source" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="scope.row.source" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="所属行业" prop="industryId" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="scope.row.industryId" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户等级" prop="level" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="scope.row.level" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="网址" prop="website" width="200" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="下次联系时间"
        prop="contactNextTime"
        width="180px"
      />
      <el-table-column align="center" label="备注" prop="remark" width="200" />
      <el-table-column align="center" label="成交状态" prop="dealStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.dealStatus" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="距进入公海天数" prop="poolDay" width="130" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="最后跟进时间"
        prop="contactLastTime"
        width="180px"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
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
      <el-table-column align="center" label="负责人" prop="ownerUserName" width="100px" />
      <el-table-column align="center" label="所属部门" prop="ownerUserDeptName" width="100px" />
      <el-table-column align="center" label="创建人" prop="creatorName" width="100px" />
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

<script lang="ts" setup name="TodayCustomer">
import * as BacklogApi from '@/api/crm/backlog'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { CONTACT_STATUS, SCENE_TYPES } from './common'

// defineOptions({ name: 'TodayCustomer' }) TODO @dhb52：1）定义改成这种；2）命名要不要改成 CustomerTodayTable，就是 模块+形容词+表格（更容易识别），然后把 tables 目录改成 components 目录

const { push } = useRouter()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  contactStatus: 1,
  sceneType: 1
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BacklogApi.getTodayCustomerPage(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 打开客户详情 */
const openDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style lang="scss"></style>
