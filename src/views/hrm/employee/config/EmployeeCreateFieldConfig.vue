<template>
  <!-- 列表 -->
  <el-table v-loading="loading" :data="list" border>
    <el-table-column label="字段分组" prop="groupName" width="180" />
    <el-table-column label="字段名称" prop="title" min-width="220" />
    <el-table-column label="新建在职员工" align="center" width="180">
      <template #default="scope">
        <el-switch v-model="scope.row.activeVisible" :disabled="scope.row.activeVisibleLocked" />
      </template>
    </el-table-column>
    <el-table-column label="新建待入职员工" align="center" width="180">
      <template #default="scope">
        <el-switch
          v-model="scope.row.pendingEntryVisible"
          :disabled="scope.row.pendingEntryVisibleLocked"
        />
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import * as EmployeeConfigApi from '@/api/hrm/employee/config'
import { HrmEmployeeEntryStatus } from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmEmployeeCreateFieldConfig' })

type EmployeeCreateFieldConfigVO = EmployeeConfigApi.HrmEmployeeFieldConfigVO & {
  activeVisible: boolean
  activeVisibleLocked: boolean
  pendingEntryVisible: boolean
  pendingEntryVisibleLocked: boolean
}

const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表的加载中
const list = ref<EmployeeCreateFieldConfigVO[]>([]) // 列表的数据

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const [activeFields, pendingEntryFields] = await Promise.all([
      EmployeeConfigApi.getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
      EmployeeConfigApi.getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY)
    ])
    const pendingEntryFieldMap = new Map(pendingEntryFields.map((field) => [field.name, field]))
    list.value = activeFields.map((field) => {
      const pendingEntryField = pendingEntryFieldMap.get(field.name)
      return {
        ...field,
        activeVisible: field.visible,
        activeVisibleLocked: field.visibleLocked,
        pendingEntryVisible: pendingEntryField!.visible,
        pendingEntryVisibleLocked: pendingEntryField!.visibleLocked
      }
    })
  } finally {
    loading.value = false
  }
}

/** 保存字段配置 */
async function submitForm() {
  // 两组配置写同一张表，依次保存避免并发替换互相加锁；前一组失败时不再保存后一组
  await EmployeeConfigApi.saveEmployeeCreateFieldConfig(
    HrmEmployeeEntryStatus.ACTIVE,
    getVisibleFields('activeVisible')
  )
  await EmployeeConfigApi.saveEmployeeCreateFieldConfig(
    HrmEmployeeEntryStatus.PENDING_ENTRY,
    getVisibleFields('pendingEntryVisible')
  )
  message.success('保存成功')
  await getList()
}

/** 转换字段显示配置 */
function getVisibleFields(field: 'activeVisible' | 'pendingEntryVisible') {
  return list.value.map((item) => ({ name: item.name, visible: item[field] }))
}

defineExpose({ submitForm }) // 提供 submitForm 方法，用于保存字段配置

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
