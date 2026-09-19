<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1050px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="会议室名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="会议室类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择类型" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="会议室位置" prop="location">
            <el-input v-model="formData.location" placeholder="请输入位置" maxlength="255" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="负责人" prop="managerUserId">
            <UserSelectV2 v-model="formData.managerUserId" @change="handleManagerChange" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人联系方式">
            <el-input v-model="formData.managerPhone" placeholder="选择负责人后显示" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="可用状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="会议室图片" prop="picUrl">
            <UploadImg v-model="formData.picUrl" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="坐席数" prop="seatCount">
            <el-input-number v-model="formData.seatCount" :min="1" :precision="0" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="会议室设备" prop="equipments">
            <el-select
              v-model="formData.equipments"
              placeholder="请选择设备"
              multiple
              class="!w-full"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_EQUIPMENT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="允许预定" prop="allowBooking">
            <el-switch v-model="formData.allowBooking" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预定需审批" prop="needApproval">
            <el-switch v-model="formData.needApproval" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="可用范围" prop="bookingScope">
            <el-radio-group v-model="formData.bookingScope">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_BOOKING_SCOPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示顺序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" :precision="0" class="!w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item
            v-if="formData.bookingScope === OaMeetingRoomBookingScope.SPECIFIED"
            label="指定成员"
            prop="bookingUserIds"
          >
            <UserSelectV2 v-model="formData.bookingUserIds" :multiple="true" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="附件" prop="fileUrls">
            <UploadFile v-model="formData.fileUrls" :limit="10" :file-size="10" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { UserVO } from '@/api/system/user'
import type { FormRules } from 'element-plus'
import * as MeetingRoomApi from '@/api/oa/meetingroom/room'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import { OaMeetingRoomStatus, OaMeetingRoomBookingScope } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaMeetingRoomForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<MeetingRoomApi.MeetingRoomVO>({
  equipments: [],
  bookingUserIds: [],
  fileUrls: []
}) // 表单数据

const formRules = reactive<FormRules>({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  location: [{ required: true, message: '位置不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
  managerUserId: [{ required: true, message: '负责人不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  bookingScope: [{ required: true, message: '预定范围不能为空', trigger: 'change' }],
  bookingUserIds: [
    { required: true, type: 'array', min: 1, message: '请选择可预定成员', trigger: 'change' }
  ],
  sort: [{ required: true, message: '排序不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单引用

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formLoading.value = true
  try {
    if (id) {
      formData.value = await MeetingRoomApi.getMeetingRoom(id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 选择负责人，回显联系方式 */
function handleManagerChange(user: UserVO | UserVO[] | undefined) {
  formData.value.managerPhone = user && !Array.isArray(user) ? user.mobile : undefined
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
      await MeetingRoomApi.createMeetingRoom(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await MeetingRoomApi.updateMeetingRoom(formData.value)
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
    status: OaMeetingRoomStatus.NORMAL,
    allowBooking: true,
    needApproval: false,
    bookingScope: OaMeetingRoomBookingScope.ALL,
    bookingUserIds: [],
    equipments: [],
    sort: 0,
    fileUrls: []
  }
  formRef.value?.resetFields()
}
</script>
