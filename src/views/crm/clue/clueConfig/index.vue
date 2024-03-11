<template>
  <ContentWrap>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="160px"
      v-loading="formLoading"
    >
      <el-card shadow="never">
        <!-- 操作 -->
        <template #header>
          <div class="flex items-center justify-between">
            <CardTitle title="线索管理设置" />
            <el-button
              type="primary"
              @click="onSubmit"
              v-hasPermi="['crm:clue-config:update']"
            >
              保存
            </el-button>
          </div>
        </template>
        <!-- 表单 -->
        <el-form-item label="列表中手机号脱敏" prop="hidphoneEnabled">
          <el-radio-group v-model="formData.hidphoneEnabled" class="ml-4">
            <el-radio :label="false" size="large">不启用</el-radio>
            <el-radio :label="true" size="large">启用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-card>
    </el-form>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as clueConfigApi from '@/api/crm/clue/clueConfig'
import { CardTitle } from '@/components/Card'

defineOptions({ name: 'CrmClueConfig' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const formLoading = ref(false)
const formData = ref({
  hidphoneEnabled: false,
})
const formRules = reactive({
  hidphoneEnabled: [{ required: true, message: '是否启用列表手机号脱敏不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 获取配置 */
const getConfig = async () => {
  try {
    formLoading.value = true
    const data = await clueConfigApi.getClueConfig()
    if (data === null) {
      return
    }
    formData.value = data
  } finally {
    formLoading.value = false
  }
}

/** 提交配置 */
const onSubmit = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as clueConfigApi.ClueConfigVO
    await clueConfigApi.saveClueConfig(data)
    message.success(t('common.updateSuccess'))
    await getConfig()
    formLoading.value = false
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  getConfig()
})
</script>
