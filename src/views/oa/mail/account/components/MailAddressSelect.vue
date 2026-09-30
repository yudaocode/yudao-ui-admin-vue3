<template>
  <el-select
    v-model="modelValue"
    multiple
    filterable
    allow-create
    default-first-option
    :reserve-keyword="false"
    :loading="loading"
    placeholder="请选择或输入邮箱地址"
    class="w-full"
  >
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</template>
<script setup lang="ts">
import * as AccountApi from '@/api/oa/mail/account'

defineOptions({ name: 'OaMailAddressSelect' })

const modelValue = defineModel<string[]>() // 选中的邮箱地址
const loading = ref(false) // 列表加载中
const accounts = ref<AccountApi.MailAccountVO[]>([]) // 当前租户邮箱及归属人
// 回复、草稿中的外部地址也需要正常回显
const options = computed(() => {
  const addresses = new Map<string, string>()
  accounts.value.forEach((account) => {
    const label = account.userName ? `${account.userName} <${account.mail}>` : account.mail
    addresses.set(
      account.mail,
      addresses.has(account.mail) ? `${addresses.get(account.mail)}、${label}` : label
    )
  })
  modelValue.value?.forEach((address) => {
    if (!addresses.has(address)) addresses.set(address, address)
  })
  return Array.from(addresses, ([value, label]) => ({ value, label }))
})

/** 查询公司邮箱地址 */
async function getList() {
  loading.value = true
  try {
    accounts.value = await AccountApi.getSimpleMailAccountList()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
