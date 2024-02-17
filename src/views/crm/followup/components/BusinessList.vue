<template>
  <el-table :data="list" :show-overflow-tooltip="true" :stripe="true" height="200">
    <el-table-column align="center" label="商机名称" prop="name" />
    <el-table-column align="center" label="客户名称" prop="customerName" />
    <el-table-column align="center" label="商机金额" prop="price" />
    <el-table-column
      :formatter="dateFormatter"
      align="center"
      label="预计成交日期"
      prop="dealTime"
      width="120px"
    />
    <el-table-column align="center" label="商机状态类型" prop="statusTypeName" width="120" />
    <el-table-column align="center" label="商机状态" prop="statusName" />
    <el-table-column
      :formatter="dateFormatter"
      align="center"
      label="更新时间"
      prop="updateTime"
      width="180px"
    />
    <el-table-column
      :formatter="dateFormatter"
      align="center"
      label="创建时间"
      prop="createTime"
      width="180px"
    />
    <el-table-column align="center" label="负责人" prop="ownerUserName" width="120" />
    <el-table-column align="center" label="创建人" prop="creatorName" width="120" />
    <el-table-column align="center" label="备注" prop="remark" />
    <el-table-column align="center" fixed="right" label="操作" width="130">
      <template #default="scope">
        <el-button link type="danger" @click="handleDelete(scope.row.id)"> 移除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as BusinessApi from '@/api/crm/business'

defineOptions({ name: 'BusinessList' })
const props = withDefaults(defineProps<{ businessIds: number[] }>(), {
  businessIds: () => []
})
const list = ref<BusinessApi.BusinessVO[]>([] as BusinessApi.BusinessVO[])
watch(
  () => props.businessIds,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    list.value = BusinessApi.getBusinessListByIds(unref(val)) as unknown as BusinessApi.BusinessVO[]
  }
)
const emits = defineEmits<{
  (e: 'update:businessIds', businessIds: number[]): void
}>()
const handleDelete = (id: number) => {
  const index = list.value.findIndex((item) => item.id === id)
  if (index !== -1) {
    list.value.splice(index, 1)
  }
  emits(
    'update:businessIds',
    list.value.map((item) => item.id)
  )
}
</script>
