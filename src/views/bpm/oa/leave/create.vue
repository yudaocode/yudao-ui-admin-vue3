<template>
  <el-row :gutter="20">
    <el-col :span="isUpdate ? 24 : 16">
      <ContentWrap title="申请信息">
        <el-form
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
            <el-button :disabled="formLoading" type="primary" @click="submitForm">
              确 定
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>
    </el-col>

    <!-- 审批相关：流程信息。编辑时，不发起流程，所以不展示 -->
    <el-col v-if="!isUpdate" :span="8">
      <ContentWrap title="审批流程" :bodyStyle="{ padding: '0 20px 0' }">
        <ProcessInstanceTimeline
          ref="timelineRef"
          :activity-nodes="activityNodes"
          :show-status-icon="false"
          @select-user-confirm="selectUserConfirm"
        />
      </ContentWrap>
    </el-col>
  </el-row>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { parseId } from '@/utils/id'

import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as LeaveApi from '@/api/bpm/leave'
import { useTagsViewStore } from '@/store/modules/tagsView'

// 审批相关：import
import * as DefinitionApi from '@/api/bpm/definition'
import ProcessInstanceTimeline from '@/views/bpm/processInstance/detail/ProcessInstanceTimeline.vue'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { CandidateStrategy, NodeId } from '@/components/SimpleProcessDesignerV2/src/consts'
import { ApprovalNodeInfo } from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmOALeaveCreate' })

const message = useMessage() // 消息弹窗
const { delView } = useTagsViewStore() // 视图操作
const { push, back, currentRoute } = useRouter() // 路由
const { query } = useRoute() // 查询参数
const isUpdate = query.type === 'update' && !!query.id // 是否编辑：只修改请假申请，审批由流程详情的【通过】处理

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
const originalData = ref<Record<string, any>>({}) // 加载的请假数据，编辑时用于判断修改了哪些字段

// 审批相关：变量
type StartUserSelectTask = {
  id: string
  name: string
}
type LeaveCreateData = LeaveApi.LeaveVO & {
  startUserSelectAssignees?: Record<string, number[]>
}
const processDefineKey = 'oa_leave' // 流程定义 Key
const startUserSelectTasks = ref<StartUserSelectTask[]>([]) // 发起人需要选择审批人的用户任务列表
const startUserSelectAssignees = ref<Record<string, number[]>>({}) // 发起人选择审批人的数据
const tempStartUserSelectAssignees = ref<Record<string, number[]>>({}) // 历史发起人选择审批人的数据，用于每次表单变更时，临时保存
const activityNodes = ref<ProcessInstanceApi.ApprovalNodeInfo[]>([]) // 审批节点信息
const processDefinitionId = ref('')

/** 提交表单 */
const submitForm = async () => {
  // 1.1 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 编辑：只保存请假申请，不发起流程
  if (isUpdate) {
    await submitUpdateForm()
    return
  }
  // 1.2 审批相关：校验指定审批人
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

  // 2. 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as unknown as LeaveCreateData
    // 审批相关：设置指定审批人
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

/** 编辑：只提交修改了的字段，保存后关闭编辑页，返回详情 */
const submitUpdateForm = async () => {
  formLoading.value = true
  try {
    // 1. 只传业务编号和修改了的字段，流程信息由后端从请假申请中读取
    const data: Record<string, any> = { id: parseId(query.id) }
    ;(Object.keys(formData.value) as (keyof typeof formData.value)[]).forEach((field) => {
      if (formData.value[field] !== originalData.value[field]) {
        data[field] = formData.value[field]
      }
    })
    await LeaveApi.updateLeave(data as LeaveApi.LeaveUpdateVO)
    message.success('保存成功')
    // 2. 关闭编辑页，返回详情（流程详情不缓存，返回后重新加载）
    delView(unref(currentRoute))
    back()
  } finally {
    formLoading.value = false
  }
}

/** 审批相关：获取审批详情 */
const getApprovalDetail = async () => {
  try {
    const data = await ProcessInstanceApi.getApprovalDetail({
      processDefinitionId: processDefinitionId.value,
      // TODO 小北：可以支持 processDefinitionKey 查询
      activityId: NodeId.START_USER_NODE_ID,
      processVariablesStr: JSON.stringify({ day: daysDifference() }) // 解决 GET 无法传递对象的问题，后端 String 再转 JSON
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

/** 审批相关：选择发起人 */
const selectUserConfirm = (id: string, userList: any[]) => {
  startUserSelectAssignees.value[id] = userList?.map((item: any) => item.id)
}

/** 计算请假天数：开始、结束时间相差的完整天数，不足一天的部分舍去；时间未选择时为 null */
const daysDifference = () => {
  const { startTime, endTime } = formData.value
  if (!startTime || !endTime) {
    return null
  }
  return Math.abs(dayjs(Number(endTime)).diff(Number(startTime), 'day'))
}

/** 获取请假数据，用于重新发起、编辑时自动填充 */
const getDetail = async (id: number) => {
  try {
    formLoading.value = true
    const data = await LeaveApi.getLeave(id)
    if (!data) {
      message.error('加载请假失败，原因：请假数据不存在')
      return
    }
    formData.value = {
      type: data.type,
      reason: data.reason,
      startTime: data.startTime,
      endTime: data.endTime
    }
    originalData.value = { ...formData.value }
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  // 编辑：只加载请假数据，不需要流程信息
  if (isUpdate) {
    await getDetail(parseId(query.id) as number)
    return
  }
  // TODO @小北：这里可以简化，统一通过 getApprovalDetail 处理么？
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

  // 如果有业务编号，说明是重新发起，需要加载原有数据
  if (query.id) {
    await getDetail(parseId(query.id) as number)
  }

  // 审批相关：加载最新的审批详情，主要用于节点预测
  await getApprovalDetail()
})

/** 审批相关：预测流程节点会因为输入的参数值而产生新的预测结果值，所以需重新预测一次, formData.value可改成实际业务中的特定字段 */
watch(
  formData.value,
  (newValue, oldValue) => {
    if (!oldValue || isUpdate) {
      return
    }
    if (newValue && Object.keys(newValue).length > 0) {
      // 记录之前的节点审批人
      tempStartUserSelectAssignees.value = startUserSelectAssignees.value
      startUserSelectAssignees.value = {}
      // 加载最新的审批详情,主要用于节点预测
      getApprovalDetail()
    }
  },
  {
    immediate: true
  }
)
</script>
