<template>
  <Dialog v-model="dialogVisible" title="选择会议室" width="1050px">
    <!-- 会议室搜索 -->
    <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="90px">
      <el-form-item label="会议室名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入会议室名称"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会议室位置" prop="location">
        <el-input
          v-model="queryParams.location"
          placeholder="请输入会议室位置"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会议室类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择会议室类型"
          clearable
          class="!w-200px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 单选列表 -->
    <el-table v-loading="loading" :data="list" highlight-current-row @row-click="handleSelect">
      <el-table-column width="55">
        <template #default="{ row }">
          <el-radio v-model="selectedId" :value="row.id" @change="handleSelect(row)">
            <span></span>
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="会议室名称" prop="name" min-width="180" />
      <el-table-column label="会议室位置" prop="location" min-width="180" />
      <el-table-column label="会议室类型" width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="坐席数" prop="seatCount" width="85" />
      <el-table-column label="可用状态" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_MEETING_ROOM_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="负责人" prop="managerName" width="120" />
      <el-table-column label="操作" width="130">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="scheduleRef.open(row.id, row.name)">
            查看预定信息
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
    <template #footer>
      <el-button type="primary" :disabled="loading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <OaMeetingRoomScheduleDialog ref="scheduleRef" :show-bookings="false" />
</template>

<script setup lang="ts">
import * as MeetingRoomApi from '@/api/oa/meetingroom/room'
import type { MeetingRoomVO } from '@/api/oa/meetingroom/room'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import OaMeetingRoomScheduleDialog from './OaMeetingRoomScheduleDialog.vue'

defineOptions({ name: 'OaMeetingRoomSelectDialog' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<MeetingRoomVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总条数
const selectedId = ref<number>() // 当前选中会议室
const selectedRoom = ref<MeetingRoomVO>() // 已选会议室，翻页时保留
const scheduleRef = ref() // 预定信息弹窗引用
const queryParams = reactive({
  name: '',
  location: '',
  type: undefined as number | undefined,
  pageNo: 1,
  pageSize: 10
}) // 搜索条件
const queryFormRef = ref() // 搜索的表单

/** 打开弹窗 */
function open(roomId?: number) {
  dialogVisible.value = true
  selectedId.value = roomId
  selectedRoom.value = undefined
  list.value = []
  total.value = 0
  resetQuery()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await MeetingRoomApi.getBookableMeetingRoomPage(queryParams)
    list.value = data.list
    total.value = data.total
    const room = list.value.find((item) => item.id === selectedId.value)
    if (room) {
      selectedRoom.value = room
    }
  } finally {
    loading.value = false
  }
}

/** 搜索操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 选中会议室 */
function handleSelect(room: MeetingRoomVO) {
  selectedId.value = room.id
  selectedRoom.value = room
}

const emit = defineEmits<{ select: [room: MeetingRoomVO] }>() // 选择成功回调

/** 确认选择 */
function submitForm() {
  const room = selectedRoom.value
  // 未重新选择时保留原会议室，不要求原记录位于当前页
  if (!room && selectedId.value) {
    dialogVisible.value = false
    return
  }
  if (!room) {
    message.warning('请选择会议室')
    return
  }
  emit('select', room)
  dialogVisible.value = false
}
</script>
