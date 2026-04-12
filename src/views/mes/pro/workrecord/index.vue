<!-- MES 工作记录列表 -->
<template>
  <doc-alert title="【生产】工作记录" url="https://doc.iocoder.cn/mes/workrecord/" />

  <ContentWrap>
    <WorkRecordStatusBar @change="getList" />

    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="用户" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" placeholder="请选择用户" class="!w-240px" />
      </el-form-item>
      <el-form-item label="工作站" prop="workstationId">
        <MdWorkstationSelect
          v-model="queryParams.workstationId"
          placeholder="请选择工作站"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="操作类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择操作类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_RECORD_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作时间" prop="createTime">
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
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-workrecord:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
    >
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="用户" align="center" prop="userNickname" />
      <el-table-column label="工作站编码" align="center" prop="workstationCode" />
      <el-table-column label="工作站名称" align="center" prop="workstationName" />
      <el-table-column label="操作类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORK_RECORD_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
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

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { ProWorkRecordApi, type ProWorkRecordLogVO } from '@/api/mes/pro/workrecord'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import WorkRecordStatusBar from './WorkRecordStatusBar.vue'

defineOptions({ name: 'MesProWorkRecordLog' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ProWorkRecordLogVO[]>([]) // 列表的数据
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  workstationId: undefined,
  type: undefined,
  createTime: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProWorkRecordApi.getWorkRecordLogPage(queryParams)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProWorkRecordApi.exportWorkRecordLog(queryParams)
    download.excel(data, '工作记录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(() => getList())
</script>
