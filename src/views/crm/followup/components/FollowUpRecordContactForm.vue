<template>
  <el-table :data="contacts" :show-overflow-tooltip="true" :stripe="true" height="150">
    <el-table-column label="姓名" fixed="left" align="center" prop="name">
      <template #default="scope">
        <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
          {{ scope.row.name }}
        </el-link>
      </template>
    </el-table-column>
    <el-table-column label="手机号" align="center" prop="mobile" />
    <el-table-column label="职位" align="center" prop="post" />
    <el-table-column label="直属上级" align="center" prop="parentName" />
    <el-table-column label="是否关键决策人" align="center" prop="master" min-width="100">
      <template #default="scope">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.master" />
      </template>
    </el-table-column>
    <el-table-column align="center" fixed="right" label="操作" width="130">
      <template #default="scope">
        <el-button link type="danger" @click="handleDelete(scope.row.id)"> 移除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'

const props = defineProps<{
  contacts: undefined
}>()
const formData = ref([])

/** 初始化联系人列表 */
watch(
  () => props.contacts,
  async (val) => {
    formData.value = val
  },
  { immediate: true }
)

/** 删除按钮操作 */
const handleDelete = (index: number) => {
  formData.value.splice(index, 1)
}
</script>
