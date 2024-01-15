<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="50%">
    <el-row>
      <el-col :span="12">
        <el-form-item label="跟进类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择跟进类型">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.CRM_FOLLOW_UP_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="下次联系时间" prop="nextTime">
          <el-date-picker
            v-model="formData.nextTime"
            placeholder="选择下次联系时间"
            type="date"
            value-format="x"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
/** 跟进记录 表单 */
defineOptions({ name: 'BusinessListSelectForm' })

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref([])

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await FollowUpRecordApi.getFollowUpRecord(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formRef.value?.resetFields()
}
</script>
