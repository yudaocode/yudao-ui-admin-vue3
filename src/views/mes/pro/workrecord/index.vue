<!-- MES 工作记录列表 -->
<template>
  <ContentWrap>
    <!-- 当前工作站绑定状态 -->
    <el-card shadow="never" class="mb-16px">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">我的工作站</span>
        </div>
      </template>
      <div class="flex items-center justify-between">
        <div v-if="myWorkstation">
          <el-tag type="success" size="large" effect="dark">
            <Icon icon="ep:monitor" class="mr-4px" />
            已上工：{{ myWorkstation.workstationCode }} - {{ myWorkstation.workstationName }}
          </el-tag>
          <span class="ml-8px text-gray-400 text-sm">
            上工时间：{{ formatDate(myWorkstation.createTime) }}
          </span>
        </div>
        <div v-else>
          <el-tag type="info" size="large">
            <Icon icon="ep:warning" class="mr-4px" />
            当前未绑定工作站
          </el-tag>
        </div>
        <div class="flex gap-8px">
          <el-popover
            v-if="!myWorkstation"
            :visible="clockInPopoverVisible"
            placement="bottom"
            :width="320"
            trigger="click"
          >
            <template #reference>
              <el-button type="success" @click="clockInPopoverVisible = true">
                <Icon icon="ep:video-play" class="mr-5px" /> 上工
              </el-button>
            </template>
            <div>
              <p class="mb-8px font-bold">选择工作站</p>
              <MdWorkstationSelect
                v-model="selectedWorkstationId"
                placeholder="请选择工作站"
                class="w-full"
              />
              <div class="mt-12px text-right">
                <el-button size="small" @click="clockInPopoverVisible = false">取消</el-button>
                <el-button
                  size="small"
                  type="success"
                  :disabled="!selectedWorkstationId"
                  @click="handleClockIn"
                >
                  确认上工
                </el-button>
              </div>
            </div>
          </el-popover>
          <el-button v-if="myWorkstation" type="danger" @click="handleClockOut">
            <Icon icon="ep:video-pause" class="mr-5px" /> 下工
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="用户" prop="userId">
        <UserSelect v-model="queryParams.userId" placeholder="请选择用户" class="!w-240px" />
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
      <el-table-column label="用户" align="center" prop="userNickname" width="120" />
      <el-table-column label="工作站编码" align="center" prop="workstationCode" width="140" />
      <el-table-column label="工作站名称" align="center" prop="workstationName" width="160" />
      <el-table-column label="操作类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag
            :type="DICT_TYPE.MES_PRO_WORK_RECORD_TYPE"
            :value="scope.row.type"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="200" />
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
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { ProWorkRecordApi, ProWorkRecordLogVO } from '@/api/mes/pro/workrecord'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'

defineOptions({ name: 'MesProWorkRecordLog' })

const message = useMessage()

const loading = ref(true)
const list = ref<ProWorkRecordLogVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  workstationId: undefined,
  type: undefined,
  createTime: undefined
})
const queryFormRef = ref()

// ========== 我的工作站 ==========
const myWorkstation = ref<ProWorkRecordLogVO | null>(null)
const clockInPopoverVisible = ref(false)
const selectedWorkstationId = ref<number>()

/** 查询当前用户工作站 */
const loadMyWorkstation = async () => {
  myWorkstation.value = await ProWorkRecordApi.getMyWorkRecord()
}

/** 上线 */
const handleClockIn = async () => {
  if (!selectedWorkstationId.value) return
  try {
    await ProWorkRecordApi.clockInWorkRecord(selectedWorkstationId.value)
    message.success('上线成功')
    clockInPopoverVisible.value = false
    selectedWorkstationId.value = undefined
    await loadMyWorkstation()
    await getList()
  } catch {}
}

/** 下线 */
const handleClockOut = async () => {
  try {
    await message.confirm('确认下线当前工作站？')
    await ProWorkRecordApi.clockOutWorkRecord()
    message.success('下线成功')
    await loadMyWorkstation()
    await getList()
  } catch {}
}

// ========== 列表查询 ==========

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
  queryFormRef.value.resetFields()
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
onMounted(async () => {
  await loadMyWorkstation()
  await getList()
})
</script>
