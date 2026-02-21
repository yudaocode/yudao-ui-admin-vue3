<!-- 安灯呼叫记录 处置弹窗 -->
<template>
  <Dialog title="处置安灯呼叫" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <!-- 只读展示呼叫信息 -->
      <el-form-item label="工作站">
        <el-input :model-value="recordInfo.workstationName" disabled />
      </el-form-item>
      <el-form-item label="发起人">
        <el-input :model-value="recordInfo.userNickname" disabled />
      </el-form-item>
      <el-form-item label="呼叫原因">
        <el-input :model-value="recordInfo.reason" disabled />
      </el-form-item>
      <el-form-item label="级别">
        <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="recordInfo.level" />
      </el-form-item>
      <!-- 可编辑字段 -->
      <!-- TODO @AI：unocss 简化 style -->
      <el-form-item label="处置时间" prop="handleTime">
        <el-date-picker
          v-model="formData.handleTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择处置时间"
          style="width: 100%"
        />
      </el-form-item>
      <!-- TODO @AI：可选，user-select；只是默认当前人； -->
      <el-form-item label="处置人" prop="handlerUserId">
        <el-input :model-value="handlerNickname" disabled placeholder="当前用户" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入处置备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProAndonRecordApi } from '@/api/mes/pro/andon/record'
import { DICT_TYPE } from '@/utils/dict'
import { useUserStoreWithOut } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'AndonHandleForm' })

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref<any>({})
const recordInfo = ref<any>({})
const handlerNickname = ref('')
const formRules = reactive({
  handleTime: [{ required: true, message: '处置时间不能为空', trigger: 'change' }],
  handlerUserId: [{ required: true, message: '处置人不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  formLoading.value = true
  // TODO @AI：还是老样子，先 reset；参考别的；
  try {
    // 加载记录信息
    recordInfo.value = await ProAndonRecordApi.getAndonRecord(id)
    // 初始化处置表单
    const userStore = useUserStoreWithOut()
    formData.value = {
      id: id,
      // TODO @AI：不需要 format；
      handleTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      handlerUserId: userStore.getUser?.id,
      remark: undefined
    }
    handlerNickname.value = userStore.getUser?.nickname || ''
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open })

/** 提交处置 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await ProAndonRecordApi.handleAndonRecord(formData.value)
    message.success('处置成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
