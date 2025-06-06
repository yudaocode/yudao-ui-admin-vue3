<template>
  <div class="end-node-wrapper">
    <div class="end-node-box cursor-pointer" :class="`${useTaskStatusClass(currentNode?.activityStatus)}`" @click="nodeClick">
      <span class="node-fixed-name" title="结束">结束</span>
    </div>
  </div>
  <el-dialog title="审批信息" v-model="dialogVisible" width="1000px" append-to-body>
      <el-row>
        <el-table
          :data="processInstanceInfos"
          size="small"
          border
          header-cell-class-name="table-header-gray"
        >
          <el-table-column
            label="序号"
            header-align="center"
            align="center"
            type="index"
            width="50"
          />
          <el-table-column
            label="发起人"
            prop="assigneeUser.nickname"
            min-width="100"
            align="center"
          />
          <el-table-column label="部门" min-width="100" align="center">
            <template #default="scope">
              {{ scope.row.assigneeUser?.deptName || scope.row.ownerUser?.deptName }}
            </template>
          </el-table-column>
          <el-table-column
            :formatter="dateFormatter"
            align="center"
            label="开始时间"
            prop="createTime"
            min-width="140"
          />
          <el-table-column
            :formatter="dateFormatter"
            align="center"
            label="结束时间"
            prop="endTime"
            min-width="140"
          />
          <el-table-column align="center" label="审批状态" prop="status" min-width="90">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
         
          <el-table-column align="center" label="耗时" prop="durationInMillis" width="100">
            <template #default="scope">
              {{ formatPast2(scope.row.durationInMillis) }}
            </template>
          </el-table-column>
        </el-table>
      </el-row>
    </el-dialog>
</template>
<script setup lang="ts">
import { SimpleFlowNode } from '../consts'
import { useWatchNode, useTaskStatusClass } from '../node'
import { dateFormatter, formatPast2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
defineOptions({
  name: 'EndEventNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null
  }
})
// 监控节点变化
const currentNode = useWatchNode(props)
// 是否只读
const readonly = inject<Boolean>('readonly')
const processInstance = inject<Ref<any>>('processInstance', ref({}))
// 审批信息的弹窗显示，用于只读模式
const dialogVisible = ref(false) // 弹窗可见性
const processInstanceInfos = ref<any[]>([]) // 流程的审批信息

const nodeClick = () => {
  if (readonly) { 
    if(processInstance && processInstance.value){
      processInstanceInfos.value = [
      {
        assigneeUser: processInstance.value.startUser,
        createTime: processInstance.value.startTime,
        endTime: processInstance.value.endTime,
        status: processInstance.value.status,
        durationInMillis: processInstance.value.durationInMillis
      }
    ]
      dialogVisible.value = true
    }
  }
}
</script>
<style lang="scss" scoped></style>
