<template>
  <el-drawer v-model="drawerVisible" title="子任务" size="880px">
    <!-- 当前任务 -->
    <template #header>
      <h4>【{{ parentTask.name }} 】审批人：{{ parentTask?.assigneeUser?.nickname }}</h4>
      <el-button
        style="margin-left: 5px"
        v-if="isSignDeleteButtonVisible(parentTask)"
        type="danger"
        plain
        @click="handleSignDelete(parentTask)"
      >
        <Icon icon="ep:remove" /> 减签
      </el-button>
    </template>
    <!-- 子任务列表 -->
    <el-table :data="parentTask.children" style="width: 100%" row-key="id" border>
      <el-table-column prop="assigneeUser.nickname" label="审批人" min-width="100">
        <template #default="scope">
          {{ scope.row.assigneeUser?.nickname || scope.row.ownerUser?.nickname }}
        </template>
      </el-table-column>
      <el-table-column prop="assigneeUser.deptName" label="所在部门" min-width="100">
        <template #default="scope">
          {{ scope.row.assigneeUser?.deptName || scope.row.ownerUser?.deptName }}
        </template>
      </el-table-column>
      <el-table-column label="审批状态" prop="status" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="提交时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" prop="operation" width="90">
        <template #default="scope">
          <el-button
            v-if="isSignDeleteButtonVisible(scope.row)"
            type="danger"
            plain
            size="small"
            @click="handleSignDelete(scope.row)"
          >
            <Icon icon="ep:remove" /> 减签
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 减签 -->
    <TaskSignDeleteForm ref="taskSignDeleteFormRef" @success="handleSignDeleteSuccess" />
  </el-drawer>
</template>
<script lang="ts" setup>
import { isEmpty } from '@/utils/is'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import TaskSignDeleteForm from './TaskSignDeleteForm.vue'

defineOptions({ name: 'TaskSignList' })

const message = useMessage() // 消息弹窗
const drawerVisible = ref(false) // 抽屉的是否展示
const parentTask = ref({} as any)

/** 打开弹窗 */
const open = async (task: any) => {
  if (isEmpty(task.children)) {
    message.warning('该任务没有子任务')
    return
  }
  parentTask.value = task
  // 展开抽屉
  drawerVisible.value = true
}
defineExpose({ open }) // 提供 openModal 方法，用于打开弹窗

/** 发起减签 */
const taskSignDeleteFormRef = ref()
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const handleSignDelete = (item: any) => {
  taskSignDeleteFormRef.value.open(item.id)
}
const handleSignDeleteSuccess = () => {
  emit('success')
  // 关闭抽屉
  drawerVisible.value = false
}

/** 是否显示减签按钮 */
const isSignDeleteButtonVisible = (task: any) => {
  return task && task.children && !isEmpty(task.children)
}
</script>
