<template>
  <doc-alert title="【合同】合同管理、合同提醒" url="https://doc.iocoder.cn/crm/contract/" />
  <doc-alert title="【通用】数据权限" url="https://doc.iocoder.cn/crm/permission/" />

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
            <CardTitle title="合同配置设置" />
            <el-button type="primary" @click="onSubmit" v-hasPermi="['crm:contract-config:update']">
              保存
            </el-button>
          </div>
        </template>
        <!-- 表单 -->
        <el-form-item label="提前提醒设置" prop="notifyEnabled">
          <el-radio-group
            v-model="formData.notifyEnabled"
            @change="changeNotifyEnable"
            class="ml-4"
          >
            <el-radio :value="false" size="large">不提醒</el-radio>
            <el-radio :value="true" size="large">提醒</el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="formData.notifyEnabled">
          <el-form-item>
            提前 <el-input-number class="mx-2" v-model="formData.notifyDays" /> 天提醒
          </el-form-item>
        </div>
      </el-card>
    </el-form>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as ContractConfigApi from '@/api/crm/contract/config'
import { CardTitle } from '@/components/Card'

defineOptions({ name: 'CrmContractConfig' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const formLoading = ref(false)
const formData = ref({
  notifyEnabled: false,
  notifyDays: undefined
})
const formRules = reactive({})
const formRef = ref() // 表单 Ref

/** 获取配置 */
const getConfig = async () => {
  try {
    formLoading.value = true
    const data = await ContractConfigApi.getContractConfig()
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
    const data = formData.value as ContractConfigApi.ContractConfigVO
    await ContractConfigApi.saveContractConfig(data)
    message.success(t('common.updateSuccess'))
    await getConfig()
    formLoading.value = false
  } finally {
    formLoading.value = false
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
