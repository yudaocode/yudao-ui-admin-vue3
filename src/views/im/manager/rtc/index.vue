<template>
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="88px"
    >
      <el-form-item label="发起人" prop="inviterUserId">
        <UserSelectV2
          v-model="queryParams.inviterUserId"
          placeholder="请选择发起人"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="会话类型" prop="conversationType">
        <el-select
          v-model="queryParams.conversationType"
          placeholder="请选择会话类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="媒体类型" prop="mediaType">
        <el-select
          v-model="queryParams.mediaType"
          placeholder="请选择媒体类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="通话状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择通话状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="结束原因" prop="endReason">
        <el-select
          v-model="queryParams.endReason"
          placeholder="请选择结束原因"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_RTC_CALL_END_REASON)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发起时间" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="100" />
      <el-table-column label="发起人" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.inviterNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.inviterUserId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="会话类型" align="center" prop="conversationType" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE" :value="row.conversationType" />
        </template>
      </el-table-column>
      <el-table-column label="群" align="center" min-width="160">
        <template #default="{ row }">
          <span v-if="row.groupId">
            {{ row.groupName || '-' }}
            <span class="text-gray-400 ml-5px">({{ row.groupId }})</span>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="媒体类型" align="center" prop="mediaType" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE" :value="row.mediaType" />
        </template>
      </el-table-column>
      <el-table-column label="通话状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_RTC_CALL_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="结束原因" align="center" prop="endReason" width="120">
        <template #default="{ row }">
          <dict-tag
            v-if="row.endReason"
            :type="DICT_TYPE.IM_RTC_CALL_END_REASON"
            :value="row.endReason"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="通话时长" align="center" width="120">
        <template #default="{ row }">
          {{ resolveCallDuration(row.acceptTime, row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column
        label="发起时间"
        align="center"
        prop="startTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openDetail(row)"
            v-hasPermi="['im:manager:rtc:query']"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 详情 -->
  <RtcCallDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ManagerRtcCallApi from '@/api/im/manager/rtc'
import { resolveCallDuration } from '@/views/im/utils/time'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import RtcCallDetail from './RtcCallDetail.vue'

defineOptions({ name: 'ImRtcCall' })

const loading = ref(true)
const total = ref(0)
const list = ref<ManagerRtcCallApi.ImManagerRtcCallVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  inviterUserId: undefined as number | undefined,
  conversationType: undefined as number | undefined,
  mediaType: undefined as number | undefined,
  status: undefined as number | undefined,
  endReason: undefined as number | undefined,
  startTime: [] as string[]
})
const queryFormRef = ref()

/** 查询通话记录分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerRtcCallApi.getManagerRtcCallPage(queryParams)
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

/** 打开详情弹窗 */
const detailRef = ref<InstanceType<typeof RtcCallDetail>>()
const openDetail = (row: ManagerRtcCallApi.ImManagerRtcCallVO) => {
  detailRef.value?.open(row)
}

onMounted(() => {
  getList()
})
</script>
