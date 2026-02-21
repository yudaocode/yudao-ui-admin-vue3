<!-- MES 安灯呼叫记录列表 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="工作站" prop="workstationId">
        <MdWorkstationSelect
          v-model="queryParams.workstationId"
          placeholder="请选择工作站"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：发起人 select -->
      <!-- TODO @AI：生产工单 select -->
      <!-- TODO @AI：工序 select -->
      <!-- TODO @AI：工序名称 select -->
      <!-- TODO @AI：处置人 select -->
      <el-form-item label="处理状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_ANDON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发起时间" prop="createTime">
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
          type="primary"
          plain
          @click="openRecordForm('create')"
          v-hasPermi="['mes:pro-andon-record:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          @click="openConfigDialog"
          v-hasPermi="['mes:pro-andon-config:query']"
        >
          <Icon icon="ep:setting" class="mr-5px" /> 安灯设置
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-andon-record:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="工作站编码" align="center" prop="workstationCode" width="120" />
      <el-table-column label="工作站名称" align="center" prop="workstationName" min-width="120" />
      <!-- TODO @AI：工单编码 -->
      <!-- TODO @AI：工序 -->
      <el-table-column label="发起人" align="center" prop="userNickname" width="100" />
      <el-table-column
        label="发起时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <!-- TODO @AI：发起时间 -->
      <!-- TODO @AI：呼叫原因 -->
      <!-- TODO @AI：级别 -->
      <!-- TODO @AI：处理时间 -->
      <!-- TODO @AI：处理人 -->
      <!-- TODO @AI：处置状态 -->
      <!-- TODO @AI：操作 -->
      <el-table-column label="工单编码" align="center" prop="workOrderCode" width="140" />
      <el-table-column label="工序名称" align="center" prop="processName" width="120" />
      <el-table-column label="呼叫原因" align="center" prop="reason" min-width="150" />
      <el-table-column label="级别" align="center" prop="level" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="scope.row.level" />
        </template>
      </el-table-column>
      <el-table-column
        label="处置时间"
        align="center"
        prop="handleTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="处置人" align="center" prop="handlerUserNickname" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === MesProAndonStatusEnum.ACTIVE"
            link
            type="success"
            @click="openHandleForm(scope.row.id)"
            v-hasPermi="['mes:pro-andon-record:update']"
          >
            处置
          </el-button>
          <el-button
            link
            type="primary"
            @click="openRecordForm('detail', scope.row.id)"
            v-hasPermi="['mes:pro-andon-record:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:pro-andon-record:delete']"
          >
            删除
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

  <!-- 弹窗：新增/详情 -->
  <AndonRecordForm ref="recordFormRef" @success="getList" />
  <!-- 弹窗：处置 -->
  <AndonHandleForm ref="handleFormRef" @success="getList" />
  <!-- 弹窗：安灯设置 -->
  <AndonConfigDialog ref="configDialogRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ProAndonRecordApi, ProAndonRecordVO } from '@/api/mes/pro/andon/record'
import AndonRecordForm from './AndonRecordForm.vue'
import AndonHandleForm from './AndonHandleForm.vue'
import AndonConfigDialog from '../config/AndonConfigForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesProAndonStatusEnum } from '@/views/mes/utils/constants'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'

defineOptions({ name: 'MesProAndon' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<ProAndonRecordVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  workstationId: undefined,
  level: undefined,
  status: undefined,
  createTime: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProAndonRecordApi.getAndonRecordPage(queryParams)
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

/** 新增/详情弹窗 */
const recordFormRef = ref()
const openRecordForm = (type: string, id?: number) => {
  recordFormRef.value.open(type, id)
}

/** 处置弹窗 */
const handleFormRef = ref()
const openHandleForm = (id: number) => {
  handleFormRef.value.open(id)
}

/** 安灯设置弹窗 */
const configDialogRef = ref()
const openConfigDialog = () => {
  configDialogRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProAndonRecordApi.deleteAndonRecord(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProAndonRecordApi.exportAndonRecord(queryParams)
    download.excel(data, '安灯呼叫记录.xls')
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
