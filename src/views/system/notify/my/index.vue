<template>
  <doc-alert title="站内信配置" url="https://doc.iocoder.cn/notify/" />

  <ContentWrap>
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
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
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
        <el-button @click="handleUpdateList">
          <Icon icon="ep:reading" class="mr-5px" /> 标记已读
        </el-button>
        <el-button @click="handleUpdateAll">
          <Icon icon="ep:reading" class="mr-5px" /> 全部已读
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      ref="tableRef"
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" :selectable="selectable" :reserve-selection="true" />
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
            @click="openDetail(scope.row)"
          >
            {{ scope.row.readStatus ? '详情' : '已读' }}
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

  <!-- 表单弹窗：详情 -->
  <MyNotifyMessageDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getBoolDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import MyNotifyMessageDetail from './MyNotifyMessageDetail.vue'

defineOptions({ name: 'SystemMyNotify' })

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
const tableRef = ref() // 表格的 Ref
const selectedIds = ref<number[]>([]) // 表格的选中 ID 数组

/** 查询列表 */
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

/** 详情操作 */
const detailRef = ref()
const openDetail = (data: NotifyMessageApi.NotifyMessageVO) => {
  if (!data.readStatus) {
    handleReadOne(data.id)
  }
  detailRef.value.open(data)
}

/** 标记一条站内信已读 */
const handleReadOne = async (id) => {
  await NotifyMessageApi.updateNotifyMessageRead(id)
  await getList()
}

/** 标记全部站内信已读 **/
const handleUpdateAll = async () => {
  await NotifyMessageApi.updateAllNotifyMessageRead()
  message.success('全部已读成功！')
  tableRef.value.clearSelection()
  await getList()
}

/** 标记一些站内信已读 **/
const handleUpdateList = async () => {
  if (selectedIds.value.length === 0) {
    return
  }
  await NotifyMessageApi.updateNotifyMessageRead(selectedIds.value)
  message.success('批量已读成功！')
  tableRef.value.clearSelection()
  await getList()
}

/** 某一行，是否允许选中 */
const selectable = (row) => {
  return !row.readStatus
}

/** 当表格选择项发生变化时会触发该事件  */
const handleSelectionChange = (array: NotifyMessageApi.NotifyMessageVO[]) => {
  selectedIds.value = []
  if (!array) {
    return
  }
  array.forEach((row) => selectedIds.value.push(row.id))
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
