<template>
  <el-card v-loading="loading" class="box-card">
    <template #header>
      <span class="el-icon-picture-outline">审批记录</span>
    </template>
    <el-col :offset="3" :span="17">
      <div class="block">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in tasks"
            :key="index"
            :icon="getTimelineItemIcon(item)"
            :type="getTimelineItemType(item)"
          >
            <p style="font-weight: 700">
              任务：{{ item.name }}
              <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT" :value="item.status" />
              <el-button
                class="ml-10px"
                v-if="!isEmpty(item.children)"
                @click="openChildrenTask(item)"
                size="small"
              >
                <Icon icon="ep:memo" /> 子任务
              </el-button>
              <el-button
                class="ml-10px"
                size="small"
                v-if="item.formId > 0"
                @click="handleFormDetail(item)"
              >
                <Icon icon="ep:document" /> 查看表单
              </el-button>
            </p>
            <el-card :body-style="{ padding: '10px' }">
              <label v-if="item.assigneeUser" style="margin-right: 30px; font-weight: normal">
                审批人：{{ item.assigneeUser.nickname }}
                <el-tag size="small" type="info">{{ item.assigneeUser.deptName }}</el-tag>
              </label>
              <label v-if="item.createTime" style="font-weight: normal">创建时间：</label>
              <label style="font-weight: normal; color: #8a909c">
                {{ formatDate(item?.createTime) }}
              </label>
              <label v-if="item.endTime" style="margin-left: 30px; font-weight: normal">
                审批时间：
              </label>
              <label v-if="item.endTime" style="font-weight: normal; color: #8a909c">
                {{ formatDate(item?.endTime) }}
              </label>
              <label v-if="item.durationInMillis" style="margin-left: 30px; font-weight: normal">
                耗时：
              </label>
              <label v-if="item.durationInMillis" style="font-weight: normal; color: #8a909c">
                {{ formatPast2(item?.durationInMillis) }}
              </label>
              <p v-if="item.reason"> 审批建议：{{ item.reason }} </p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-col>
  </el-card>

  <!-- 弹窗：子任务  -->
  <TaskSignList ref="taskSignListRef" @success="refresh" />
  <!-- 弹窗：表单 -->
  <Dialog title="表单详情" v-model="taskFormVisible" width="600">
    <form-create
      ref="fApi"
      v-model="taskForm.value"
      :option="taskForm.option"
      :rule="taskForm.rule"
    />
  </Dialog>
</template>
<script lang="ts" setup>
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { propTypes } from '@/utils/propTypes'
import { DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import TaskSignList from './dialog/TaskSignList.vue'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import { setConfAndFields2 } from '@/utils/formCreate'

defineOptions({ name: 'BpmProcessInstanceTaskList' })

defineProps({
  loading: propTypes.bool, // 是否加载中
  tasks: propTypes.arrayOf(propTypes.object) // 流程任务的数组
})

/** 获得任务对应的 icon */
// TODO @芋艿：对应的 icon 需要调整
const getTimelineItemIcon = (item) => {
  if (item.status === 1) {
    return 'el-icon-time'
  }
  if (item.status === 2) {
    return 'el-icon-check'
  }
  if (item.status === 3) {
    return 'el-icon-close'
  }
  if (item.status === 4) {
    return 'el-icon-remove-outline'
  }
  if (item.status === 5) {
    return 'el-icon-back'
  }
  return ''
}

/** 获得任务对应的颜色 */
const getTimelineItemType = (item: any) => {
  if (item.status === 1) {
    return 'primary'
  }
  if (item.status === 2) {
    return 'success'
  }
  if (item.status === 3) {
    return 'danger'
  }
  if (item.status === 4) {
    return 'info'
  }
  if (item.status === 5) {
    return 'warning'
  }
  if (item.status === 6) {
    return 'default'
  }
  if (item.status === 7 || item.status === 8) {
    return 'warning'
  }
  return ''
}

/** 子任务 */
const taskSignListRef = ref()
const openChildrenTask = (item: any) => {
  taskSignListRef.value.open(item)
}

/** 查看表单 */
const fApi = ref<ApiAttrs>() // form-create 的 API 操作类
const taskForm = ref({
  rule: [],
  option: {},
  value: {}
}) // 流程任务的表单详情
const taskFormVisible = ref(false)
const handleFormDetail = async (row) => {
  // 设置表单
  setConfAndFields2(taskForm, row.formConf, row.formFields, row.formVariables)
  // 弹窗打开
  taskFormVisible.value = true
  // 隐藏提交、重置按钮，设置禁用只读
  await nextTick()
  fApi.value.fapi.btn.show(false)
  fApi.value?.fapi?.resetBtn.show(false)
  fApi.value?.fapi?.disabled(true)
}

/** 刷新数据 */
const emit = defineEmits(['refresh']) // 定义 success 事件，用于操作成功后的回调
const refresh = () => {
  emit('refresh')
}
</script>
