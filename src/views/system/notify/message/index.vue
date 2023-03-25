<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="用户类型" prop="userType">
        <el-select
          v-model="queryParams.userType"
          placeholder="请选择用户类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.USER_TYPE)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板编码" prop="templateCode">
        <el-input
          v-model="queryParams.templateCode"
          placeholder="请输入模板编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模版类型" prop="templateType">
        <el-select
          v-model="queryParams.templateType"
          placeholder="请选择模版类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <el-table ref="tableRef" v-loading="loading" :data="list" :height="tableHeight">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="用户类型" align="center" prop="userType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.USER_TYPE" :value="scope.row.userType" />
        </template>
      </el-table-column>
      <el-table-column label="用户编号" align="center" prop="userId" width="80" />
      <el-table-column label="模版编号" align="center" prop="templateId" width="80" />
      <el-table-column label="模板编码" align="center" prop="templateCode" width="80" />
      <el-table-column label="发送人名称" align="center" prop="templateNickname" width="180" />
      <el-table-column
        label="模版内容"
        align="center"
        prop="templateContent"
        width="200"
        show-overflow-tooltip
      />
      <el-table-column
        label="模版参数"
        align="center"
        prop="templateParams"
        width="180"
        show-overflow-tooltip
      >
        <template #default="scope"> {{ scope.row.templateParams }}</template>
      </el-table-column>
      <el-table-column label="模版类型" align="center" prop="templateType" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="scope.row.templateType" />
        </template>
      </el-table-column>
      <el-table-column label="是否已读" align="center" prop="readStatus" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.readStatus" />
        </template>
      </el-table-column>
      <el-table-column
        label="阅读时间"
        align="center"
        prop="readTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal(scope.row)"
            v-hasPermi="['system:notify-message:query']"
          >
            详情
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
  </content-wrap>

  <!-- 表单弹窗：详情 -->
  <notify-message-detail ref="modalRef" />
</template>
<script setup lang="ts" name="NotifyMessage">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import NotifyMessageDetail from './detail.vue'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userType: undefined,
  userId: undefined,
  templateCode: undefined,
  templateType: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const tableRef = ref()
const tableHeight = ref() // table高度

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NotifyMessageApi.getNotifyMessagePageApi(queryParams)
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

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 详情操作 */
const modalRef = ref()
const openModal = (data: NotifyMessageApi.NotifyMessageVO) => {
  modalRef.value.openModal(data)
}

/** 初始化 **/
onMounted(() => {
  getList()
  // TODO 感觉表格自适应高度体验很好的，目前简单实现 需要进一步优化,如根据筛选条件展开或收缩改变盒子高度时
  tableHeight.value = window.innerHeight - tableRef.value.$el.offsetTop - 85 - 155
  // 监听浏览器高度变化
  window.onresize = () => {
    tableHeight.value = window.innerHeight - tableRef.value.$el.offsetTop - 85 - 155
  }
})
</script>
