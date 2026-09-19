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
      <el-form-item label="会议室名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入会议室名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会议室位置" prop="location">
        <el-input
          v-model="queryParams.location"
          placeholder="请输入会议室位置"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会议室类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择会议室类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人" prop="managerName">
        <el-input
          v-model="queryParams.managerName"
          placeholder="请输入负责人姓名"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="可用状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择可用状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:meeting-room:create']"
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
      <el-table-column label="会议室图片" width="110">
        <template #default="{ row }">
          <el-image
            v-if="row.picUrl"
            :src="row.picUrl"
            :preview-src-list="[row.picUrl]"
            preview-teleported
            fit="cover"
            class="h-50px w-70px"
          />
        </template>
      </el-table-column>
      <el-table-column label="会议室名称" prop="name" min-width="180" show-overflow-tooltip />
      <el-table-column label="坐席数" prop="seatCount" min-width="90" show-overflow-tooltip />
      <el-table-column label="会议室类型" prop="type" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="会议室位置" prop="location" min-width="180" show-overflow-tooltip />
      <el-table-column label="负责人" prop="managerName" min-width="120" show-overflow-tooltip />
      <el-table-column label="联系方式" prop="managerPhone" min-width="140" show-overflow-tooltip />
      <el-table-column label="可用状态" prop="status" min-width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="会议室设备" prop="equipments" min-width="200">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_EQUIPMENT" :value="row.equipments" />
        </template>
      </el-table-column>
      <el-table-column label="允许预定" prop="allowBooking" min-width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.allowBooking" />
        </template>
      </el-table-column>
      <el-table-column label="需审批" prop="needApproval" min-width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.needApproval" />
        </template>
      </el-table-column>
      <el-table-column label="显示顺序" prop="sort" min-width="80" show-overflow-tooltip />
      <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            v-hasPermi="['oa:meeting-room:query', 'oa:meeting-room-booking:query']"
            @click="scheduleRef.open(row.id, row.name)"
          >
            预定信息
          </el-button>
          <el-button
            v-hasPermi="['oa:meeting-room:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['oa:meeting-room:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
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
  <OaMeetingRoomForm ref="formRef" @success="getList" />
  <OaMeetingRoomScheduleDialog ref="scheduleRef" />
</template>

<script setup lang="ts">
import * as MeetingRoomApi from '@/api/oa/meetingroom/room'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

import OaMeetingRoomForm from './OaMeetingRoomForm.vue'
import OaMeetingRoomScheduleDialog from './components/OaMeetingRoomScheduleDialog.vue'

defineOptions({ name: 'OaMeetingRoom' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表加载中
const list = ref<MeetingRoomApi.MeetingRoomVO[]>([]) // 列表数据
const total = ref(0) // 总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  managerName: undefined as string | undefined,
  name: undefined as string | undefined,
  location: undefined as string | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined
})
const queryFormRef = ref() // 搜索表单引用
const formRef = ref() // 表单引用
const scheduleRef = ref() // 日程弹窗引用

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await MeetingRoomApi.getMeetingRoomPage(queryParams)
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
    await MeetingRoomApi.deleteMeetingRoom(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
