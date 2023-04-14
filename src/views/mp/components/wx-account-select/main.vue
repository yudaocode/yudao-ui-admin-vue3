<template>
  <el-select v-model="account.id" placeholder="请选择公众号" class="!w-240px" @change="onChanged">
    <el-option v-for="item in accountList" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</template>

<script lang="ts" setup name="WxAccountSelect">
import * as MpAccountApi from '@/api/mp/account'

const account: MpAccountApi.AccountVO = reactive({
  id: undefined,
  name: ''
})
const accountList: Ref<MpAccountApi.AccountVO[]> = ref([])

const emit = defineEmits<{
  (e: 'change', id?: number, name?: string): void
}>()

onMounted(() => {
  handleQuery()
})

const handleQuery = async () => {
  accountList.value = await MpAccountApi.getSimpleAccountList()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    account.id = accountList.value[0].id
    emit('change', account.id, account.name)
  }
}

const onChanged = () => {
  emit('change', account.id, account.name)
}
</script>
