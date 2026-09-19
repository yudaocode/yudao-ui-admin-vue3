<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1000px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="会议室" prop="roomId">
        <el-input
          v-model="formData.roomName"
          placeholder="请选择会议室"
          readonly
          class="cursor-pointer"
          @click="roomSelectRef.open(formData.roomId)"
        >
          <template #suffix><Icon icon="ep:search" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="会议室位置">
        <el-input v-model="formData.roomLocation" disabled placeholder="选择会议室后显示" />
      </el-form-item>
      <el-form-item label="会议主题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入会议主题" maxlength="200" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="会议开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              value-format="x"
              placeholder="请选择开始时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="会议结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              value-format="x"
              placeholder="请选择结束时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主持人" prop="moderatorUserId">
            <UserSelectV2 v-model="formData.moderatorUserId" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="会议提醒" prop="reminderType">
            <el-select v-model="formData.reminderType" placeholder="请选择提醒方式" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_REMINDER_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="参会人员" prop="attendeeUserIds">
        <UserSelectV2 v-model="formData.attendeeUserIds" :multiple="true" />
      </el-form-item>
      <el-form-item label="会议说明" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入会议内容"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="申请备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :limit="5" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <OaMeetingRoomSelectDialog ref="roomSelectRef" @select="handleRoomSelect" />
</template>

<script setup lang="ts">
import OaMeetingRoomSelectDialog from '../room/components/OaMeetingRoomSelectDialog.vue'
import type { FormRules } from 'element-plus'
import * as MeetingRoomBookingApi from '@/api/oa/meetingroom/booking'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import type { MeetingRoomVO } from '@/api/oa/meetingroom/room'
import { OaMeetingRoomReminderType } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaMeetingRoomBookingForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<MeetingRoomBookingApi.MeetingRoomBookingVO>({
  attendeeUserIds: [],
  fileUrls: []
}) // 表单数据
const formRules = reactive<FormRules>({
  roomId: [{ required: true, message: '会议室不能为空', trigger: 'change' }],
  title: [{ required: true, message: '会议主题不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [
    { required: true, message: '结束时间不能为空', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (
          value &&
          formData.value.startTime &&
          Number(value) <= Number(formData.value.startTime)
        ) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  moderatorUserId: [{ required: true, message: '主持人不能为空', trigger: 'change' }],
  reminderType: [{ required: true, message: '提醒方式不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单引用
const roomSelectRef = ref() // 会议室选择弹窗引用

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formLoading.value = true
  try {
    if (id) {
      formData.value = await MeetingRoomBookingApi.getMeetingRoomBooking(id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 选择会议室，回显名称和位置 */
function handleRoomSelect(room: MeetingRoomVO) {
  formData.value.roomId = room.id
  formData.value.roomLocation = room.location
  formData.value.roomName = room.name
}

/** 提交表单 */
async function submitForm() {
  // 1. 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 2. 保存数据
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await MeetingRoomBookingApi.createMeetingRoomBooking(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await MeetingRoomBookingApi.updateMeetingRoomBooking(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    attendeeUserIds: [],
    reminderType: OaMeetingRoomReminderType.NONE,
    fileUrls: []
  }
  formRef.value?.resetFields()
}
</script>
