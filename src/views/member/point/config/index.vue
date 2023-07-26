<template>
  <ContentWrap>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="hideId" v-show="false">
        <el-input v-model="formData.id" />
      </el-form-item>
      <!-- TODO @xiaqing：展示给用户的字段名，可以和 crmeb 保持一直，然后每一个表单都有类似 crmeb 的 tip；例如说：积分抵用比例(1积分抵多少金额)单位：元 -->
      <el-form-item label="积分抵扣" prop="tradeDeductEnable">
        <el-switch v-model="formData.tradeDeductEnable" />
      </el-form-item>
      <!-- TODO @xiaqing：用户看到的是元，最多 2 位；分是后端的存储哈 -->
      <el-form-item label="抵扣单位(分)" prop="tradeDeductUnitPrice">
        <el-input-number
          v-model="formData.tradeDeductUnitPrice"
          placeholder="请输入抵扣单位(分)"
          style="width: 300px"
        />
      </el-form-item>
      <el-form-item label="积分抵扣最大值" prop="tradeDeductMaxPrice">
        <el-input-number
          v-model="formData.tradeDeductMaxPrice"
          placeholder="请输入积分抵扣最大值"
          style="width: 300px"
        />
      </el-form-item>
      <el-form-item label="1 元赠送多少分" prop="tradeGivePoint">
        <el-input-number
          v-model="formData.tradeGivePoint"
          placeholder="请输入 1 元赠送多少积分"
          style="width: 300px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">提交</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/point/config'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  tradeDeductEnable: undefined,
  tradeDeductUnitPrice: undefined,
  tradeDeductMaxPrice: undefined,
  tradeGivePoint: undefined
})
const formRules = reactive({})
const formRef = ref() // 表单 Ref

/** 修改积分配置 */
const onSubmit = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ConfigApi.ConfigVO
    await ConfigApi.saveConfig(data)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 获得积分配置 */
const getConfig = async () => {
  try {
    const data = await ConfigApi.getConfig()
    formData.value = data
  } finally {
  }
}

onMounted(() => {
  getConfig()
})
</script>
