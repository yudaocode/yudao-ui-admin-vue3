<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="业务编码" prop="bizId">
        <el-input v-model="formData.bizId" placeholder="请输入业务编码" />
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="formData.bizType" placeholder="请选择业务类型">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.POINT_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型" prop="type">
        <el-select v-model="formData.type" placeholder="操作类型">
          <el-option label="增加" value="1" />
          <el-option label="扣减" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="积分标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入积分标题" />
      </el-form-item>
      <el-form-item label="积分描述">
        <Editor :model-value="formData.description" height="150px" />
      </el-form-item>
      <el-form-item label="积分" prop="point">
        <el-input v-model="formData.point" placeholder="请输入积分" />
      </el-form-item>
      <el-form-item label="变动后的积分" prop="totalPoint">
        <el-input v-model="formData.totalPoint" placeholder="请输入变动后的积分" />
      </el-form-item>
      <el-form-item label="积分状态" prop="status">
        <el-select v-model="formData.status" placeholder="积分状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.POINT_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户id" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入用户id" />
      </el-form-item>
      <el-form-item label="冻结时间" prop="freezingTime">
        <el-date-picker
          v-model="formData.freezingTime"
          type="date"
          value-format="x"
          placeholder="选择冻结时间"
        />
      </el-form-item>
      <el-form-item label="解冻时间" prop="thawingTime">
        <el-date-picker
          v-model="formData.thawingTime"
          type="date"
          value-format="x"
          placeholder="选择解冻时间"
        />
      </el-form-item>
      <el-form-item label="发生时间" prop="createDate">
        <el-date-picker
          v-model="formData.createDate"
          type="date"
          value-format="x"
          placeholder="选择发生时间"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getStrDictOptions, getIntDictOptions } from '@/utils/dict'
import * as RecordApi from '@/api/point/record'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  bizId: undefined,
  bizType: undefined,
  type: undefined,
  title: undefined,
  description: undefined,
  point: undefined,
  totalPoint: undefined,
  status: undefined,
  userId: undefined,
  freezingTime: undefined,
  thawingTime: undefined,
  createDate: undefined
})
const formRules = reactive({
  totalPoint: [{ required: true, message: '变动后的积分不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await RecordApi.getRecord(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as RecordApi.RecordVO
    if (formType.value === 'create') {
      await RecordApi.createRecord(data)
      message.success(t('common.createSuccess'))
    } else {
      await RecordApi.updateRecord(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    bizId: undefined,
    bizType: undefined,
    type: undefined,
    title: undefined,
    description: undefined,
    point: undefined,
    totalPoint: undefined,
    status: undefined,
    userId: undefined,
    freezingTime: undefined,
    thawingTime: undefined,
    createDate: undefined
  }
  formRef.value?.resetFields()
}
</script>
