<template>
  <el-select
    v-model="accountId"
    placeholder="请选择公众号"
    class="!w-240px"
    @change="accountChanged"
  >
    <el-option v-for="item in accountList" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</template>

<script lang="ts" setup name="WxMpSelect">
import * as MpAccountApi from '@/api/mp/account'

const accountId: Ref<number | undefined> = ref()
const accountList: Ref<MpAccountApi.AccountVO[]> = ref([])

const emit = defineEmits<{
  (e: 'change', id: number | undefined): void
}>()

onMounted(() => {
  handleQuery()
})

const handleQuery = async () => {
  accountList.value = await MpAccountApi.getSimpleAccountList()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    accountId.value = accountList.value[0].id
    emit('change', accountId.value)
  }
}

const accountChanged = () => {
  emit('change', accountId.value)
}
</script>
