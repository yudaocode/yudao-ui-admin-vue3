<template>
  <ContentWrap>
    <div class="pb-5 text-xl">
      {{ title }}
    </div>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="状态" prop="contactStatus">
        <el-select v-model="queryParams.contactStatus" class="!w-240px" placeholder="状态">
          <el-option
            v-for="(option, index) in CONTACT_STATUS"
            :label="option.label"
            :value="option.value"
            :key="index"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="归属" prop="sceneType">
        <el-select v-model="queryParams.sceneType" class="!w-240px" placeholder="归属">
          <el-option
            v-for="(option, index) in SCENE_TYPES"
            :label="option.label"
            :value="option.value"
            :key="index"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery(undefined)">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="编号" prop="id" />
      <el-table-column align="center" label="客户名称" prop="name" width="160">
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
      <!-- TODO @puhui999：距进入公海天数 -->
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
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as MessageApi from '@/api/crm/message'

const title = ref('今日需联系客户') // TODO @dbh52：这个不用枚举一个变量哈；
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = ref<{
  // TODO @dbh52：这个 ref 类型定义可以去掉哈。之前定义的原因，是因为 idea 报错了；默认 idea 可以推导出类型
  pageNo: number
  pageSize: number
  contactStatus: number | undefined
  sceneType: number | undefined
}>({
  pageNo: 1,
  pageSize: 10,
  contactStatus: 1,
  sceneType: 1
})
const queryFormRef = ref() // 搜索的表单

const CONTACT_STATUS = [
  { label: '今日需联系', value: 1 },
  { label: '已逾期', value: 2 },
  { label: '已联系', value: 3 }
]

const SCENE_TYPES = [
  // TODO 芋艿：貌似可以搞成全局枚举
  { label: '我负责的', value: 1 },
  { label: '我跟进的', value: 2 },
  { label: '我参与的', value: 3 },
  { label: '下属负责的', value: 4 }
]

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MessageApi.getTodayCustomerPage(queryParams.value)
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

/** 重置按钮操作 */
const resetQuery = (func: Function | undefined = undefined) => {
  queryFormRef.value.resetFields()
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
    contactStatus: 1,
    sceneType: 1
  }
  // TODO @dbh52：这里的 func 是不是可以去掉哈；
  func && func()
  handleQuery()
}

/** 打开客户详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style lang="scss"></style>
