<template>
  <el-table :data="list" :show-overflow-tooltip="true" :stripe="true" height="200">
    <el-table-column align="center" fixed="left" label="姓名" prop="name" width="140" />
    <el-table-column align="center" fixed="left" label="客户名称" prop="customerName" width="120" />
    <el-table-column align="center" label="手机" prop="mobile" width="120" />
    <el-table-column align="center" label="电话" prop="telephone" width="120" />
    <el-table-column align="center" label="邮箱" prop="email" width="120" />
    <el-table-column align="center" label="职位" prop="post" width="120" />
    <el-table-column align="center" label="地址" prop="detailAddress" width="120" />
    <el-table-column
      :formatter="dateFormatter"
      align="center"
      label="下次联系时间"
      prop="contactNextTime"
      width="180px"
    />
    <el-table-column align="center" label="关键决策人" prop="master" width="100">
      <template #default="scope">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.master" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="直属上级" prop="parentName" width="140" />
    <el-table-column
      :formatter="dateFormatter"
      align="center"
      label="最后跟进时间"
      prop="contactLastTime"
      width="180px"
    />
    <el-table-column align="center" label="性别" prop="sex">
      <template #default="scope">
        <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="scope.row.sex" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="负责人" prop="ownerUserName" width="120" />
    <el-table-column align="center" label="创建人" prop="creatorName" width="120" />
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
import { DICT_TYPE } from '@/utils/dict'
import * as ContactApi from '@/api/crm/contact'

defineOptions({ name: 'ContactList' })
const props = withDefaults(defineProps<{ contactIds: number[] }>(), {
  contactIds: () => []
})
const list = ref<ContactApi.ContactVO[]>([] as ContactApi.ContactVO[])
const getContactList = async () => {
  list.value = (await ContactApi.getContactListByIds(
    unref(props.contactIds)
  )) as unknown as ContactApi.ContactVO[]
}
watch(
  () => props.contactIds,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    getContactList()
  }
)
const emits = defineEmits<{
  (e: 'update:contactIds', contactIds: number[]): void
}>()
const handleDelete = (id: number) => {
  const index = list.value.findIndex((item) => item.id === id)
  if (index !== -1) {
    list.value.splice(index, 1)
  }
  emits(
    'update:contactIds',
    list.value.map((item) => item.id)
  )
}
</script>
