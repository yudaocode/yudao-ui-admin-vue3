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
            <CardTitle title="客户公海规则设置" />
            <el-button
              type="primary"
              @click="onSubmit"
              v-hasPermi="['crm:customer-pool-config:update']"
            >
              保存
            </el-button>
          </div>
        </template>
        <!-- 表单 -->
        <el-form-item label="客户公海规则设置" prop="enabled">
          <el-radio-group v-model="formData.enabled" @change="changeEnable" class="ml-4">
            <el-radio :label="false" size="large">不启用</el-radio>
            <el-radio :label="true" size="large">启用</el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="formData.enabled">
          <el-form-item>
            <el-input-number class="mr-2" v-model="formData.contactExpireDays" />
            天不跟进或
            <el-input-number class="mx-2" v-model="formData.dealExpireDays" />
            天未成交
          </el-form-item>
          <el-form-item label="提前提醒设置" prop="notifyEnabled">
            <el-radio-group
              v-model="formData.notifyEnabled"
              @change="changeNotifyEnable"
              class="ml-4"
            >
              <el-radio :label="false" size="large">不提醒</el-radio>
              <el-radio :label="true" size="large">提醒</el-radio>
            </el-radio-group>
          </el-form-item>
          <div v-if="formData.notifyEnabled">
            <el-form-item>
              提前 <el-input-number class="mx-2" v-model="formData.notifyDays" /> 天提醒
            </el-form-item>
          </div>
        </div>
      </el-card>
    </el-form>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as CustomerPoolConfigApi from '@/api/crm/customer/poolConfig'
import { CardTitle } from '@/components/Card'

defineOptions({ name: 'CrmCustomerPoolConfig' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const formLoading = ref(false)
const formData = ref({
  enabled: false,
  contactExpireDays: undefined,
  dealExpireDays: undefined,
  notifyEnabled: false,
  notifyDays: undefined
})
const formRules = reactive({
  enabled: [{ required: true, message: '是否启用客户公海不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 获取配置 */
const getConfig = async () => {
  try {
    formLoading.value = true
    const data = await CustomerPoolConfigApi.getCustomerPoolConfig()
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
    const data = formData.value as CustomerPoolConfigApi.CustomerPoolConfigVO
    await CustomerPoolConfigApi.saveCustomerPoolConfig(data)
    message.success(t('common.updateSuccess'))
    await getConfig()
    formLoading.value = false
  } finally {
    formLoading.value = false
  }
}

/** 更改客户公海规则设置 */
const changeEnable = () => {
  if (!formData.value.enabled) {
    formData.value.contactExpireDays = undefined
    formData.value.dealExpireDays = undefined
    formData.value.notifyEnabled = false
    formData.value.notifyDays = undefined
  }
}

/** 更改提前提醒设置 */
const changeNotifyEnable = () => {
  if (!formData.value.notifyEnabled) {
    formData.value.notifyDays = undefined
  }
}

onMounted(() => {
  getConfig()
})
</script>
