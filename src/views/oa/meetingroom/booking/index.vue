<template>
  <doc-alert
    title="【行政】会议室、车辆管理"
    url="https://doc.iocoder.cn/oa/administration/meeting-vehicle/"
  />
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="110px"
      class="-mb-15px"
    >
      <el-form-item label="单据编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入单据编号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option label="未提交" :value="BpmProcessInstanceStatus.NOT_START" />
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS).filter(
              (item) => item.value !== BpmProcessInstanceStatus.NOT_START
            )"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="会议室名称" prop="roomName">
        <el-input
          v-model="queryParams.roomName"
          placeholder="请输入会议室名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会议主题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入会议主题"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="主持人" prop="moderatorName">
        <el-input
          v-model="queryParams.moderatorName"
          placeholder="请输入主持人"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="申请部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="使用状态" prop="useStatus">
        <el-select
          v-model="queryParams.useStatus"
          placeholder="请选择使用状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_USE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="会议开始时间" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="会议结束时间" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建人" prop="creator">
        <UserSelectV2 v-model="queryParams.creator" class="!w-240px" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:meeting-room-booking:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" prop="no" min-width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" prop="status" min-width="110">
        <template #default="{ row }">
          <el-tag v-if="row.status === BpmProcessInstanceStatus.NOT_START" type="info">
            未提交
          </el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="使用状态" prop="useStatus" min-width="110">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_USE_STATUS" :value="row.useStatus" />
        </template>
      </el-table-column>
      <el-table-column label="会议室名称" prop="roomName" min-width="160" show-overflow-tooltip />
      <el-table-column
        label="会议室位置"
        prop="roomLocation"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column label="会议室类型" width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_TYPE" :value="row.roomType" />
        </template>
      </el-table-column>
      <el-table-column label="会议主题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column
        label="会议开始时间"
        prop="startTime"
        min-width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="会议结束时间"
        prop="endTime"
        min-width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="主持人" prop="moderatorName" min-width="120" show-overflow-tooltip />
      <el-table-column label="申请人" prop="creatorName" min-width="120" show-overflow-tooltip />
      <el-table-column label="申请部门" prop="deptName" min-width="140" show-overflow-tooltip />
      <el-table-column
        label="创建时间"
        prop="createTime"
        min-width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.processInstanceId"
            link
            type="primary"
            @click="
              router.push({
                path: '/bpm/process-instance/detail',
                query: { id: row.processInstanceId }
              })
            "
          >
            进度
          </el-button>
          <template v-if="row.status === BpmProcessInstanceStatus.NOT_START">
            <el-button
              v-hasPermi="['oa:meeting-room-booking:update']"
              link
              type="primary"
              @click="openForm('update', row.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['oa:meeting-room-booking:create']"
              link
              type="primary"
              @click="handleSubmit(row.id)"
            >
              提交
            </el-button>
            <el-button
              v-hasPermi="['oa:meeting-room-booking:delete']"
              link
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.APPROVE &&
              row.useStatus === OaMeetingRoomUseStatus.PENDING
            "
            v-hasPermi="['oa:meeting-room-booking:update']"
            link
            type="primary"
            @click="handleStart(row.id)"
          >
            开始
          </el-button>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.APPROVE &&
              row.useStatus === OaMeetingRoomUseStatus.IN_USE
            "
            v-hasPermi="['oa:meeting-room-booking:update']"
            link
            type="primary"
            @click="handleFinish(row.id)"
          >
            完成
          </el-button>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.RUNNING ||
              (row.status === BpmProcessInstanceStatus.APPROVE &&
                row.useStatus === OaMeetingRoomUseStatus.PENDING)
            "
            v-hasPermi="['oa:meeting-room-booking:update']"
            link
            type="danger"
            @click="handleCancel(row.id)"
          >
            取消
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

  <!-- 表单弹窗 -->
  <OaMeetingRoomBookingForm ref="formRef" @success="getList" />
  <!-- 详情弹窗 -->
  <OaMeetingRoomBookingDetail ref="detailRef" />
</template>

<script setup lang="ts">
import * as MeetingRoomBookingApi from '@/api/oa/meetingroom/booking'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { OaMeetingRoomUseStatus } from '@/views/oa/utils/constants'
import OaMeetingRoomBookingDetail from './OaMeetingRoomBookingDetail.vue'
import OaMeetingRoomBookingForm from './OaMeetingRoomBookingForm.vue'

defineOptions({ name: 'OaMeetingRoomBooking' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter() // 路由
const loading = ref(true) // 列表加载中
const list = ref<MeetingRoomBookingApi.MeetingRoomBookingVO[]>([]) // 列表数据
const total = ref(0) // 总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  deptId: undefined as number | undefined,
  no: undefined as string | undefined,
  roomName: undefined as string | undefined,
  title: undefined as string | undefined,
  moderatorName: undefined as string | undefined,
  status: undefined as number | undefined,
  useStatus: undefined as number | undefined,
  startTime: [],
  endTime: [],
  creator: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索表单引用
const formRef = ref() // 表单引用
const detailRef = ref() // 详情弹窗引用

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await MeetingRoomBookingApi.getMeetingRoomBookingPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增、修改操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 1. 删除确认
    await message.delConfirm()
    // 2. 发起删除
    await MeetingRoomBookingApi.deleteMeetingRoomBooking(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 打开详情 */
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 提交预定 */
async function handleSubmit(id: number) {
  try {
    // 1. 操作确认
    await message.confirm('确定提交这条会议室预定吗？')
    // 2. 更新状态并刷新列表
    await MeetingRoomBookingApi.submitMeetingRoomBooking(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 取消预定 */
async function handleCancel(id: number) {
  try {
    // 1. 操作确认
    await message.confirm('确定取消这条会议室预定吗？')
    // 2. 更新状态并刷新列表
    await MeetingRoomBookingApi.cancelMeetingRoomBooking(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 开始使用预定 */
async function handleStart(id: number) {
  try {
    // 1. 操作确认
    await message.confirm('确定开始使用这条会议室预定吗？')
    // 2. 更新状态并刷新列表
    await MeetingRoomBookingApi.startMeetingRoomBooking(id)
    message.success('开始使用成功')
    await getList()
  } catch {}
}

/** 完成使用预定 */
async function handleFinish(id: number) {
  try {
    // 1. 操作确认
    await message.confirm('确定完成使用这条会议室预定吗？')
    // 2. 更新状态并刷新列表
    await MeetingRoomBookingApi.finishMeetingRoomBooking(id)
    message.success('完成使用成功')
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
