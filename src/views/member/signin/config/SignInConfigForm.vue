<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="签到天数" prop="day">
        <el-input-number v-model="formData.day" :min="1" :max="7" :precision="0" />
        <el-text class="mx-1" style="margin-left: 10px" type="danger">
          只允许设置 1-7，默认签到 7 天为一个周期
        </el-text>
      </el-form-item>
      <el-form-item label="奖励积分" prop="point">
        <el-input-number v-model="formData.point" :min="0" :precision="0" />
      </el-form-item>
      <el-form-item label="奖励经验" prop="experience">
        <el-input-number v-model="formData.experience" :min="0" :precision="0" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as SignInConfigApi from '@/api/member/signin/config'
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<SignInConfigApi.SignInConfigVO>({} as SignInConfigApi.SignInConfigVO)
// 奖励校验规则
const awardValidator = (rule: any, _value: any, callback: any) => {
  if (!formData.value.point && !formData.value.experience) {
    callback(new Error('奖励积分与奖励经验至少配置一个'))
    return
  }

  // 清除另一个字段的错误提示
  const otherAwardField = rule?.field === 'point' ? 'experience' : 'point'
  formRef.value.validateField(otherAwardField, () => null)
  callback()
}
const formRules = reactive({
  day: [{ required: true, message: '签到天数不能空', trigger: 'blur' }],
  point: [
    { required: true, message: '奖励积分不能空', trigger: 'blur' },
    { validator: awardValidator, trigger: 'blur' }
  ],
  experience: [
    { required: true, message: '奖励经验不能空', trigger: 'blur' },
    { validator: awardValidator, trigger: 'blur' }
  ]
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
      formData.value = await SignInConfigApi.getSignInConfig(id)
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
    if (formType.value === 'create') {
      await SignInConfigApi.createSignInConfig(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await SignInConfigApi.updateSignInConfig(formData.value)
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
    day: undefined,
    point: 0,
    experience: 0,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
