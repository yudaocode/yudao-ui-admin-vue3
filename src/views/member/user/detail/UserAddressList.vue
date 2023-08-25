<template>
  <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
    <el-table-column label="地址编号" align="center" prop="id" width="150px" />
    <el-table-column label="收件人名称" align="center" prop="name" width="150px" />
    <el-table-column label="手机号" align="center" prop="mobile" width="150px" />
    <el-table-column label="地区编码" align="center" prop="areaId" width="150px" />
    <el-table-column label="收件详细地址" align="center" prop="detailAddress" />
    <el-table-column label="是否默认" align="center" prop="defaultStatus" width="150px">
      <template #default="scope">
        <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="Number(scope.row.defaultStatus)" />
      </template>
    </el-table-column>
    <el-table-column
      label="创建时间"
      align="center"
      prop="createTime"
      :formatter="dateFormatter"
      width="180px"
    />
  </el-table>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as AddressApi from '@/api/member/address'

const { userId }: { userId: number } = defineProps({
  userId: {
    type: Number,
    required: true
  }
})

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await AddressApi.getAddressList({ userId })
  } finally {
    loading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss"></style>
