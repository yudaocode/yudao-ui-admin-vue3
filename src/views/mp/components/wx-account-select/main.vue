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
  (e: 'change', id: number, name: string): void
}>()

const handleQuery = async () => {
  accountList.value = await MpAccountApi.getSimpleAccountList()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    account.id = accountList.value[0].id
    if (account.id) {
      account.name = accountList.value[0].name
      emit('change', account.id, account.name)
    }
  }
}

const onChanged = (id?: number) => {
  const found = accountList.value.find((v) => v.id === id)
  if (account.id) {
    account.name = found ? found.name : ''
    emit('change', account.id, account.name)
  }
}

/** 初始化 */
onMounted(() => {
  handleQuery()
})
</script>
