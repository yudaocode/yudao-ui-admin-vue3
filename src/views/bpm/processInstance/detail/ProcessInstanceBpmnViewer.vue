<template>
  <el-card v-loading="loading" class="box-card">
    <template #header>
      <span class="el-icon-picture-outline">流程图</span>
    </template>
    <MyProcessViewer
      key="designer"
      :activityData="activityList"
      :prefix="bpmnControlForm.prefix"
      :processInstanceData="processInstance"
      :taskData="tasks"
      :value="bpmnXml"
      v-bind="bpmnControlForm"
    />
  </el-card>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'
import * as ActivityApi from '@/api/bpm/activity'

defineOptions({ name: 'BpmProcessInstanceBpmnViewer' })

const props = defineProps({
  loading: propTypes.bool, // 是否加载中
  id: propTypes.string, // 流程实例的编号
  processInstance: propTypes.any, // 流程实例的信息
  tasks: propTypes.array, // 流程任务的数组
  bpmnXml: propTypes.string // BPMN XML
})

const bpmnControlForm = ref({
  prefix: 'flowable'
})
const activityList = ref([]) // 任务列表

/** 只有 loading 完成时，才去加载流程列表 */
watch(
  () => props.loading,
  async (value) => {
    if (value && props.id) {
      activityList.value = await ActivityApi.getActivityList({
        processInstanceId: props.id
      })
    }
  }
)
</script>
<style>
.box-card {
  width: 100%;
  margin-bottom: 20px;
}
</style>
