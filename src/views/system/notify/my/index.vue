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
      <el-form-item label="是否已读" prop="readStatus">
        <el-select
          v-model="queryParams.readStatus"
          placeholder="请选择状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发送时间" prop="createTime">
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
        <el-button @click="handleUpdateList"
          ><Icon icon="ep:reading" class="mr-5px" /> 标记已读</el-button
        >
        <el-button @click="handleUpdateAll"
          ><Icon icon="ep:reading" class="mr-5px" /> 全部已读</el-button
        >
      </el-form-item>
    </el-form>
    <!-- <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button @click="handleUpdateList"
          ><Icon icon="ep:refresh" class="mr-5px" /> 标记已读</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button @click="handleUpdateAll"
          ><Icon icon="ep:refresh" class="mr-5px" /> 全部已读</el-button
        >
      </el-col>
    </el-row> -->
  </content-wrap>

  <content-wrap>
    <!-- 列表 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="list"
      :height="tableHeight"
      :row-key="getRowKeys"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" :selectable="selectable" :reserve-selection="true" />
      <!-- <el-table-column label="编号" align="center" prop="id" /> -->
      <el-table-column label="发送人" align="center" prop="templateNickname" width="180" />
      <el-table-column
        label="发送时间"
        align="center"
        prop="createTime"
        width="200"
        :formatter="dateFormatter"
      />
      <el-table-column label="类型" align="center" prop="templateType" width="180">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="scope.row.templateType" />
        </template>
      </el-table-column>
      <el-table-column
        label="消息内容"
        align="center"
        prop="templateContent"
        show-overflow-tooltip
      />
      <el-table-column label="是否已读" align="center" prop="readStatus" width="160">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.readStatus" />
        </template>
      </el-table-column>
      <el-table-column
        label="阅读时间"
        align="center"
        prop="readTime"
        width="200"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button
            link
            :type="scope.row.readStatus ? 'primary' : 'warning'"
            @click="openModal(scope.row)"
          >
            {{ scope.row.readStatus ? '详情' : '查阅' }}
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
  <my-notify-message-detail ref="modalRef" />
</template>

<script setup lang="ts" name="MyNotifyMessage">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import MyNotifyMessageDetail from './detail.vue'

const message = useMessage() // 消息

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  readStatus: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const tableRef = ref()
const tableHeight = ref() // table高度
const selectedNum = ref(0) //表格select选中的条数
const selectedIds = ref([] as any[]) //表格select复选框选中的id
const multipleSelection = ref([])

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NotifyMessageApi.getMyNotifyMessagePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 详情操作 */
const modalRef = ref()
const openModal = (data: NotifyMessageApi.NotifyMessageVO) => {
  if (!data.readStatus) {
    handleUpdate(data.id)
  }
  modalRef.value.openModal(data)
}

// 标记指定 id 已读
const handleUpdate = async (ids) => {
  await NotifyMessageApi.updateNotifyMessageRead(ids)
  //message.success('标记已读成功！')
  handleQuery()
}

// 标记全部已读
const handleUpdateAll = async () => {
  await NotifyMessageApi.updateAllNotifyMessageRead()
  message.success('全部已读成功！')
  handleQuery()
}

// 标记勾选 ids 已读
const handleUpdateList = async () => {
  if (selectedIds.value.length === 0) {
    return
  }
  await NotifyMessageApi.updateNotifyMessageRead(selectedIds.value)
  message.success('批量已读成功！')
  tableRef.value.clearSelection()
  handleQuery()
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  tableRef.value.clearSelection()
  handleQuery()
}

/** 初始化 **/
onMounted(() => {
  getList()
  // TODO 感觉表格自适应高度体验好些，目前简单实现 需要进一步优化
  tableHeight.value = window.innerHeight - tableRef.value.$el.offsetTop - 85 - 155
  // 监听浏览器高度变化
  window.onresize = () => {
    tableHeight.value = window.innerHeight - tableRef.value.$el.offsetTop - 85 - 155
  }
})

// 禁用某行复选框
const selectable = (row) => {
  return !row.readStatus
}

//选中的list
const getRowKeys = (row) => {
  return row.id
}
//当表格选择项发生变化时会触发该事件
const handleSelectionChange = (val) => {
  // 解决来回切换页面，也无法清除上次选中情况
  multipleSelection.value = val
  selectedNum.value = multipleSelection.value.length
  selectedIds.value = []
  if (val) {
    undefined
    val.forEach((row) => {
      undefined
      if (row) {
        undefined
        selectedIds.value.push(row.id)
      }
    })
  }
}
</script>
