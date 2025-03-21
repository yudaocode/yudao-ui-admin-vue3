<template>
  <ContentWrap :bodyStyle="{ padding: '10px 20px 0' }">
    <el-row :gutter="20">
      <el-col :span="16"
        ><el-form
          ref="formRef"
          v-loading="formLoading"
          :model="formData"
          :rules="formRules"
          label-width="80px"
        >
          <el-form-item label="请假类型" prop="type">
            <el-select v-model="formData.type" clearable placeholder="请选择请假类型">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.BPM_OA_LEAVE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              clearable
              placeholder="请选择开始时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              clearable
              placeholder="请选择结束时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
          <el-form-item label="原因" prop="reason">
            <el-input v-model="formData.reason" placeholder="请输入请假原因" type="textarea" />
          </el-form-item>
          <el-form-item>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
          </el-form-item>
        </el-form></el-col
      >
      <!-- 新增    ====== begin ======== -->
      <el-col :span="8"
        ><!-- 流程时间线 -->
        <ProcessInstanceTimeline
          ref="timelineRef"
          :activity-nodes="activityNodes"
          :show-status-icon="false"
          @select-user-confirm="selectUserConfirm"
        />
      </el-col>
      <!-- 新增    ====== end ======== -->
    </el-row>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as LeaveApi from '@/api/bpm/leave'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as DefinitionApi from '@/api/bpm/definition'
//  新增    ====== begin ========
import ProcessInstanceTimeline from '../../processInstance/detail/ProcessInstanceTimeline.vue'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { CandidateStrategy, NodeId } from '@/components/SimpleProcessDesignerV2/src/consts'
import { ApprovalNodeInfo } from '@/api/bpm/processInstance'
//  新增    ====== end ========
defineOptions({ name: 'BpmOALeaveCreate' })

const message = useMessage() // 消息弹窗
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  type: undefined,
  reason: undefined,
  startTime: undefined,
  endTime: undefined
})
const formRules = reactive({
  type: [{ required: true, message: '请假类型不能为空', trigger: 'blur' }],
  reason: [{ required: true, message: '请假原因不能为空', trigger: 'change' }],
  startTime: [{ required: true, message: '请假开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '请假结束时间不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

// 指定审批人
const processDefineKey = 'oa_leave' // 流程定义 Key
const startUserSelectTasks = ref([]) // 发起人需要选择审批人的用户任务列表
const startUserSelectAssignees = ref({}) // 发起人选择审批人的数据
//  新增    ====== begin ========
const tempStartUserSelectAssignees = ref({}) // 历史发起人选择审批人的数据，用于每次表单变更时，临时保存
const activityNodes = ref<ProcessInstanceApi.ApprovalNodeInfo[]>([]) // 审批节点信息
const processDefinitionId = ref('')
//  新增    ====== end ========
/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 校验指定审批人
  if (startUserSelectTasks.value?.length > 0) {
    for (const userTask of startUserSelectTasks.value) {
      if (
        Array.isArray(startUserSelectAssignees.value[userTask.id]) &&
        startUserSelectAssignees.value[userTask.id].length === 0
      ) {
        return message.warning(`请选择${userTask.name}的审批人`)
      }
    }
  }

  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as unknown as LeaveApi.LeaveVO
    // 设置指定审批人
    if (startUserSelectTasks.value?.length > 0) {
      data.startUserSelectAssignees = startUserSelectAssignees.value
    }
    await LeaveApi.createLeave(data)
    message.success('发起成功')
    // 关闭当前 Tab
    delView(unref(currentRoute))
    await push({ name: 'BpmOALeave' })
  } finally {
    formLoading.value = false
  }
}

//  新增    ====== begin ========
/** 获取审批详情 */
const getApprovalDetail = async (row: any) => {
  try {
    const data = await ProcessInstanceApi.getApprovalDetail({
      processDefinitionId: row.id,
      activityId: NodeId.START_USER_NODE_ID,
      processVariablesStr: row.processVariablesStr // 解决 GET 无法传递对象的问题，后端 String 再转 JSON
    })

    if (!data) {
      message.error('查询不到审批详情信息！')
      return
    }
    // 获取审批节点，显示 Timeline 的数据
    activityNodes.value = data.activityNodes

    // 获取发起人自选的任务
    startUserSelectTasks.value = data.activityNodes?.filter(
      (node: ApprovalNodeInfo) => CandidateStrategy.START_USER_SELECT === node.candidateStrategy
    )
    // 恢复之前的选择审批人
    if (startUserSelectTasks.value?.length > 0) {
      for (const node of startUserSelectTasks.value) {
        if (
          tempStartUserSelectAssignees.value[node.id] &&
          tempStartUserSelectAssignees.value[node.id].length > 0
        ) {
          startUserSelectAssignees.value[node.id] = tempStartUserSelectAssignees.value[node.id]
        } else {
          startUserSelectAssignees.value[node.id] = []
        }
      }
    }
  } finally {
  }
}

/** 选择发起人 */
const selectUserConfirm = (id: string, userList: any[]) => {
  startUserSelectAssignees.value[id] = userList?.map((item: any) => item.id)
}
//  新增    ====== end ========

/** 初始化 */
onMounted(async () => {
  const processDefinitionDetail = await DefinitionApi.getProcessDefinition(
    undefined,
    processDefineKey
  )

  if (!processDefinitionDetail) {
    message.error('OA 请假的流程模型未配置，请检查！')
    return
  }
  processDefinitionId.value = processDefinitionDetail.id
  startUserSelectTasks.value = processDefinitionDetail.startUserSelectTasks
  //  新增    ====== begin ========
  // 查询流程预测节点
  getApprovalDetail({
    id: processDefinitionId.value,
    processVariablesStr: JSON.stringify(formData.value)
  })
  //  新增    ====== end ========
})
//  新增    ====== begin ========
/** 预测流程节点会因为输入的参数值而产生新的预测结果值，所以需重新预测一次 */
watch(
  formData.value,
  (newValue, oldValue) => {
    if (!oldValue) {
      return
    }
    if (newValue && Object.keys(newValue).length > 0) {
      // 记录之前的节点审批人
      tempStartUserSelectAssignees.value = startUserSelectAssignees.value
      startUserSelectAssignees.value = {}
      // 加载最新的审批详情
      getApprovalDetail({
        id: processDefinitionId.value,
        processVariablesStr: JSON.stringify(newValue) // 解决 GET 无法传递对象的问题，后端 String 再转 JSON
      })
    }
  },
  {
    immediate: true
  }
  //  新增    ====== end ========
)
</script>
