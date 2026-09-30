<template>
  <!-- 邮箱账号选择 -->
  <el-select
    v-model="selectValue"
    placeholder="请选择邮箱账号"
    :disabled="disabled"
    filterable
    @change="emit('change')"
  >
    <el-option
      v-for="account in accounts"
      :key="account.id"
      :value="account.id!"
      :label="account.mail"
    />
  </el-select>
</template>

<script setup lang="ts">
import type { MailAccountVO } from '@/api/oa/mail/account'

defineOptions({ name: 'OaMailAccountSelect' })

defineProps<{
  accounts: MailAccountVO[]
  disabled?: boolean
}>()

const selectValue = defineModel<number>() // 当前邮箱账号编号
const emit = defineEmits<{ change: [] }>() // 账号切换事件
</script>
