<template>
  <el-form class="-mb-15px" ref="queryFormRef" :inline="true" label-width="68px">
    <el-form-item label="公众号" prop="accountId">
      <!-- TODO 芋艿：需要将 el-form 和 el-select 解耦 -->
      <el-select
        v-model="accountId"
        placeholder="请选择公众号"
        class="!w-240px"
        @change="accountChanged()"
      >
        <el-option v-for="item in accountList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <slot name="actions"></slot>
    </el-form-item>
  </el-form>
</template>

<script setup name="WxAccountSelect">
import * as MpAccountApi from '@/api/mp/account'
const accountId = ref()
const accountList = ref([])
const queryFormRef = ref()

const emit = defineEmits(['change'])

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
