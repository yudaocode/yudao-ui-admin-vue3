<template>
  <el-drawer v-model="drawerVisible" title="子任务" size="70%">
    <!-- 当前任务 -->
    <template #header>
      <h4>【{{ baseTask.name }} 】审批人：{{ baseTask.assigneeUser?.nickname }}</h4>
      <el-button
        style="margin-left: 5px"
        v-if="isSubSignButtonVisible(baseTask)"
        type="danger"
        plain
        @click="handleSubSign(baseTask)"
      >
        <Icon icon="ep:remove" /> 减签
      </el-button>
    </template>
    <!-- 子任务列表 -->
    <el-table :data="baseTask.children" style="width: 100%" row-key="id" border>
      <el-table-column prop="assigneeUser.nickname" label="审批人" />
      <el-table-column prop="assigneeUser.deptName" label="所在部门" />
      <el-table-column label="审批状态" prop="result">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT" :value="scope.row.result" />
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
      <el-table-column label="操作" prop="operation">
        <template #default="scope">
          <el-button
            v-if="isSubSignButtonVisible(scope.row)"
            type="danger"
            plain
            @click="handleSubSign(scope.row)"
          >
            <Icon icon="ep:remove" /> 减签
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 减签 -->
    <TaskSubSignDialogForm ref="taskSubSignDialogForm" />
  </el-drawer>
</template>
<script lang="ts" setup>
import { isEmpty } from '@/utils/is'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import TaskSubSignDialogForm from './TaskSubSignDialogForm.vue'

defineOptions({ name: 'ProcessInstanceChildrenTaskList' })

const message = useMessage() // 消息弹窗
const drawerVisible = ref(false) // 抽屉的是否展示

const baseTask = ref<object>({})
/** 打开弹窗 */
const open = async (task: any) => {
  if (isEmpty(task.children)) {
    message.warning('该任务没有子任务')
    return
  }
  baseTask.value = task
  // 展开抽屉
  drawerVisible.value = true
}
defineExpose({ open }) // 提供 openModal 方法，用于打开弹窗

/** 发起减签 */
const taskSubSignDialogForm = ref()
const handleSubSign = (item) => {
  taskSubSignDialogForm.value.open(item.id)
  // TODO @海洋：减签后，需要刷新下界面哈
}

/** 是否显示减签按钮 */
const isSubSignButtonVisible = (task: any) => {
  if (task && task.children && !isEmpty(task.children)) {
    // 有子任务，且子任务有任意一个是 待处理 和 待前置任务完成 则显示减签按钮
    const subTask = task.children.find((item) => item.result === 1 || item.result === 9)
    return !isEmpty(subTask)
  }
  return false
}
</script>
