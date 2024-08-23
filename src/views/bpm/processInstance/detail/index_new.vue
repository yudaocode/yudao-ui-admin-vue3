<template>
  <ContentWrap :bodyStyle="{ padding: '10px 20px' }" class="position-relative">
    <Icon
      class="!position-fixed right-80px"
      :size="130"
      :icon="`svg-icon:audit${processInstance.status}`"
    />
    <div class="text-#878c93">编号：{{ id }}</div>
    <el-divider class="!my-8px" />
    <div class="flex items-center gap-5 mb-10px">
      <div class="text-26px font-bold mb-5px">{{ processInstance.name }}</div>
      <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="processInstance.status" />
    </div>

    <div class="flex items-center gap-5 mb-10px text-13px">
      <div class="bg-gray-100 h-35px rounded-3xl flex items-center p-8px gap-2 dark:color-gray-600">
        <img class="rounded-full h-28px" src="@/assets/imgs/avatar.jpg" alt="" />
        {{ processInstance?.startUser?.nickname }}
      </div>
      <div class="text-#878c93"> {{ formatDate(processInstance.startTime) }} 提交 </div>
    </div>

    <el-tabs>
      <!-- 表单信息 -->
      <el-tab-pane label="表单信息">
        <el-row :gutter="10">
          <el-col :span="18" class="!flex !flex-col formCol">
            <!-- 表单信息 -->
            <div v-loading="processInstanceLoading" class="form-box flex flex-col mb-30px flex-1">
              <!-- 情况一：流程表单 -->
              <el-col
                v-if="processInstance?.processDefinition?.formType === 10"
                :offset="6"
                :span="16"
              >
                <form-create
                  v-model="detailForm.value"
                  v-model:api="fApi"
                  :option="detailForm.option"
                  :rule="detailForm.rule"
                />
              </el-col>
              <!-- 情况二：业务表单 -->
              <div v-if="processInstance?.processDefinition?.formType === 20">
                <BusinessFormComponent :id="processInstance.businessKey" />
              </div>
            </div>

            <el-affix target=".formCol" position="bottom" class="h-50px" v-if="runningTask?.id">
              <el-divider class="!mb-8px !mt-0" />
              <div
                class="pl-50px text-14px flex items-center color-#32373c dark:color-#fff font-bold btn-container"
              >
                <el-popover :visible="passVisible" placement="top-end" :width="500" trigger="click">
                  <template #reference>
                    <el-button plain type="success" @click="openPopover('1')">
                      <Icon icon="ep:select" />&nbsp; 通过
                    </el-button>
                  </template>
                  <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
                    <el-form
                      label-position="top"
                      class="mb-auto"
                      ref="formRef"
                      :model="auditForm"
                      :rules="auditRule"
                      label-width="100px"
                    >
                      <el-form-item
                        v-if="processInstance && processInstance.startUser"
                        label="流程发起人"
                      >
                        {{ processInstance?.startUser.nickname }}
                        <el-tag size="small" type="info" class="ml-8px">
                          {{ processInstance?.startUser.deptName }}
                        </el-tag>
                      </el-form-item>
                      <el-card v-if="runningTask.formId > 0" class="mb-15px !-mt-10px">
                        <template #header>
                          <span class="el-icon-picture-outline">
                            填写表单【{{ runningTask?.formName }}】
                          </span>
                        </template>
                        <form-create
                          v-model="approveForm.value"
                          v-model:api="approveFormFApi"
                          :option="approveForm.option"
                          :rule="approveForm.rule"
                        />
                      </el-card>
                      <el-form-item label="审批建议" prop="reason">
                        <el-input
                          v-model="auditForm.reason"
                          placeholder="请输入审批建议"
                          type="textarea"
                        />
                      </el-form-item>
                      <el-form-item label="抄送人" prop="copyUserIds">
                        <el-select
                          v-model="auditForm.copyUserIds"
                          multiple
                          placeholder="请选择抄送人"
                        >
                          <el-option
                            v-for="itemx in userOptions"
                            :key="itemx.id"
                            :label="itemx.nickname"
                            :value="itemx.id"
                          />
                        </el-select>
                      </el-form-item>

                      <el-form-item>
                        <el-button
                          :disabled="formLoading"
                          type="success"
                          @click="handleAudit(true)"
                        >
                          通过
                        </el-button>
                        <el-button @click="passVisible = false"> 取消 </el-button>
                      </el-form-item>
                    </el-form>
                  </div>
                </el-popover>
                <el-popover
                  :visible="rejectVisible"
                  placement="top-end"
                  :width="500"
                  trigger="click"
                >
                  <template #reference>
                    <el-button class="mr-20px" plain type="danger" @click="openPopover('2')">
                      <Icon icon="ep:close" />&nbsp; 拒绝
                    </el-button>
                  </template>
                  <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
                    <el-form
                      label-position="top"
                      class="mb-auto"
                      ref="formRef"
                      :model="auditForm"
                      :rules="auditRule"
                      label-width="100px"
                    >
                      <el-form-item
                        v-if="processInstance && processInstance.startUser"
                        label="流程发起人"
                      >
                        {{ processInstance?.startUser.nickname }}
                        <el-tag size="small" type="info" class="ml-8px">
                          {{ processInstance?.startUser.deptName }}
                        </el-tag>
                      </el-form-item>
                      <el-card v-if="runningTask.formId > 0" class="mb-15px !-mt-10px">
                        <template #header>
                          <span class="el-icon-picture-outline">
                            填写表单【{{ runningTask?.formName }}】
                          </span>
                        </template>
                        <form-create
                          v-model="approveForm.value"
                          v-model:api="approveFormFApi"
                          :option="approveForm.option"
                          :rule="approveForm.rule"
                        />
                      </el-card>
                      <el-form-item label="审批建议" prop="reason">
                        <el-input
                          v-model="auditForm.reason"
                          placeholder="请输入审批建议"
                          type="textarea"
                        />
                      </el-form-item>
                      <el-form-item label="抄送人" prop="copyUserIds">
                        <el-select
                          v-model="auditForm.copyUserIds"
                          multiple
                          placeholder="请选择抄送人"
                        >
                          <el-option
                            v-for="itemx in userOptions"
                            :key="itemx.id"
                            :label="itemx.nickname"
                            :value="itemx.id"
                          />
                        </el-select>
                      </el-form-item>

                      <el-form-item>
                        <el-button
                          :disabled="formLoading"
                          type="danger"
                          @click="handleAudit(false)"
                        >
                          拒绝
                        </el-button>
                        <el-button @click="rejectVisible = false"> 取消 </el-button>
                      </el-form-item>
                    </el-form>
                  </div>
                </el-popover>
                <div @click="handleSend"> <Icon :size="14" icon="svg-icon:send" />&nbsp;抄送 </div>
                <div @click="openTaskUpdateAssigneeForm">
                  <Icon :size="14" icon="fa:share-square-o" />&nbsp;转交
                </div>
                <div @click="handleDelegate">
                  <Icon :size="14" icon="ep:position" />&nbsp;委派
                </div>
                <div @click="handleSign"> <Icon :size="14" icon="ep:plus" />&nbsp;加签 </div>
                <div @click="handleBack"> <Icon :size="14" icon="fa:mail-reply" />&nbsp;退回 </div>
              </div>
            </el-affix>
          </el-col>
          <el-col :span="6">
            <el-timeline class="pt-20px">
              <el-timeline-item type="primary" size="large">
                <div class="flex flex-col items-start gap-2">
                  <div class="font-bold"> 发起人：{{ processInstance?.startUser?.nickname }}</div>
                  <el-tag type="success">发起</el-tag>
                  <div class="text-#a5a5a5 text-12px">
                    发起时间：{{ formatDate(processInstance.startTime) }}
                  </div>
                </div>
              </el-timeline-item>
              <el-timeline-item
                v-for="(activity, index) in tasks"
                :key="index"
                type="primary"
                size="large"
              >
                <div class="flex flex-col items-start gap-2">
                  <div class="font-bold"> 审批人：{{ activity.assigneeUser?.nickname }}</div>
                  <dict-tag
                    :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
                    :value="activity.status"
                  />
                  <!-- TODO：暂无该字段 -->
                  <div v-if="activity.receiveTime" class="text-#a5a5a5 text-12px">
                    接收时间：{{ formatDate(activity.receiveTime) }}
                  </div>
                  <div v-if="activity.createTime" class="text-#a5a5a5 text-12px">
                    审批时间：{{ formatDate(activity.createTime) }}
                  </div>
                  <div v-if="activity.opinion" class="text-#a5a5a5 text-12px w-100%">
                    <div class="mb-5px">审批意见：</div>
                    <div
                      class="w-100% border-1px border-#a5a5a5 border-dashed rounded py-5px px-15px text-#2d2d2d"
                    >
                      {{ activity.opinion }}
                    </div>
                  </div>
                </div>
                <!-- 该节点用户的头像 -->
                <!-- <template #dot>
                  <img :src="activity?.avatar" alt="" />
                </template> -->
              </el-timeline-item>
            </el-timeline>
          </el-col>
        </el-row>
      </el-tab-pane>
      <!-- 流程图 -->
      <el-tab-pane label="流程图">
        <!-- 高亮流程图 -->
        <ProcessInstanceBpmnViewer
          :id="`${id}`"
          :bpmn-xml="bpmnXml"
          :loading="processInstanceLoading"
          :process-instance="processInstance"
          :tasks="tasks"
        />
      </el-tab-pane>
      <!-- 流转记录 -->
      <el-tab-pane label="流转记录">
        <!-- 审批记录 -->
        <ProcessInstanceTaskList
          :loading="tasksLoad"
          :process-instance="processInstance"
          :tasks="tasks"
          @refresh="getTaskList"
        />
      </el-tab-pane>
      <!-- 流转评论 -->
      <el-tab-pane label="流转评论"> 流转评论 </el-tab-pane>
    </el-tabs>

    <!-- 弹窗：转派审批人 -->
    <TaskTransferForm ref="taskTransferFormRef" @success="getDetail" />
    <!-- 弹窗：回退节点 -->
    <TaskReturnForm ref="taskReturnFormRef" @success="getDetail" />
    <!-- 弹窗：委派，将任务委派给别人处理，处理完成后，会重新回到原审批人手中-->
    <TaskDelegateForm ref="taskDelegateForm" @success="getDetail" />
    <!-- 弹窗：加签，当前任务审批人为A，向前加签选了一个C，则需要C先审批，然后再是A审批，向后加签B，A审批完，需要B再审批完，才算完成这个任务节点 -->
    <TaskSignCreateForm ref="taskSignCreateFormRef" @success="getDetail" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { useUserStore } from '@/store/modules/user'
import { setConfAndFields2 } from '@/utils/formCreate'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as TaskApi from '@/api/bpm/task'
import ProcessInstanceBpmnViewer from './ProcessInstanceBpmnViewer.vue'
import ProcessInstanceTaskList from './ProcessInstanceTaskList.vue'
import TaskReturnForm from './dialog/TaskReturnForm.vue'
import TaskDelegateForm from './dialog/TaskDelegateForm.vue'
import TaskTransferForm from './dialog/TaskTransferForm.vue'
import TaskSignCreateForm from './dialog/TaskSignCreateForm.vue'
import { registerComponent } from '@/utils/routerHelper'
import { isEmpty } from '@/utils/is'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'BpmProcessInstanceDetail' })

const { query } = useRoute() // 查询参数
const message = useMessage() // 消息弹窗
const { proxy } = getCurrentInstance() as any

const userId = useUserStore().getUser.id // 当前登录的编号
const id = query.id as unknown as string // 流程实例的编号
const processInstanceLoading = ref(false) // 流程实例的加载中
const formLoading = ref(false) // 表单加载中
const passVisible = ref(false) // 是否显示
const rejectVisible = ref(false) // 是否显示
const processInstance = ref<any>({}) // 流程实例
const bpmnXml = ref('') // BPMN XML
const tasksLoad = ref(true) // 任务的加载中
const tasks = ref<any[]>([]) // 任务列表
// ========== 审批信息 ==========
const runningTask = ref<any>({}) // 运行中的任务
const formRef = ref()
const auditForm = ref<any>({}) // 审批任务的表单
const auditRule = reactive({
  reason: [{ required: true, message: '审批建议不能为空', trigger: 'blur' }]
})
const approveForm = ref<any>({}) // 审批通过时，额外的补充信息
const approveFormFApi = ref<any>({}) // approveForms 的 fAPi

// ========== 申请信息 ==========
const fApi = ref<ApiAttrs>() //
const detailForm = ref({
  rule: [],
  option: {},
  value: {}
}) // 流程实例的表单详情

/** 监听 approveFormFApis，实现它对应的 form-create 初始化后，隐藏掉对应的表单提交按钮 */
watch(
  () => approveFormFApi.value,
  (val) => {
    val?.btn?.show(false)
    val?.resetBtn?.show(false)
  },
  {
    deep: true
  }
)

/** 处理审批通过和不通过的操作 */
const handleAudit = async (pass) => {
  formLoading.value = true
  try {
    const auditFormRef = proxy.$refs['formRef']
    // 1.2 校验表单
    const elForm = unref(auditFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return

    // 2.1 提交审批
    const data = {
      id: runningTask.value.id,
      reason: auditForm.value.reason,
      copyUserIds: auditForm.value.copyUserIds
    }
    if (pass) {
      // 审批通过，并且有额外的 approveForm 表单，需要校验 + 拼接到 data 表单里提交
      const formCreateApi = approveFormFApi.value
      if (Object.keys(formCreateApi)?.length > 0) {
        await formCreateApi.validate()
        // @ts-ignore
        data.variables = approveForm.value.value
      }
      await TaskApi.approveTask(data)
      message.success('审批通过成功')
    } else {
      await TaskApi.rejectTask(data)
      message.success('审批不通过成功')
    }
    // 2.2 加载最新数据
    getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 转派审批人 */
const taskTransferFormRef = ref()
const openTaskUpdateAssigneeForm = () => {
  taskTransferFormRef.value.open(runningTask.value.id)
}

/** 处理审批退回的操作 */
const taskDelegateForm = ref()
const handleDelegate = async () => {
  taskDelegateForm.value.open(runningTask.value.id)
}

/** 处理审批退回的操作 */
const taskReturnFormRef = ref()
const handleBack = async () => {
  taskReturnFormRef.value.open(runningTask.value.id)
}

/** 处理审批加签的操作 */
const taskSignCreateFormRef = ref()
const handleSign = async () => {
  taskSignCreateFormRef.value.open(runningTask.value.id)
}

/** 获得详情 */
const getDetail = () => {
  // 1. 获得流程实例相关
  getProcessInstance()
  // 2. 获得流程任务列表（审批记录）
  getTaskList()
}

/** 加载流程实例 */
const BusinessFormComponent = ref<any>(null) // 异步组件
const getProcessInstance = async () => {
  try {
    processInstanceLoading.value = true
    const data = await ProcessInstanceApi.getProcessInstance(id)
    if (!data) {
      message.error('查询不到流程信息！')
      return
    }
    processInstance.value = data

    // 设置表单信息
    const processDefinition = data.processDefinition
    if (processDefinition.formType === 10) {
      setConfAndFields2(
        detailForm,
        processDefinition.formConf,
        processDefinition.formFields,
        data.formVariables
      )
      nextTick().then(() => {
        fApi.value?.btn.show(false)
        fApi.value?.resetBtn.show(false)
        fApi.value?.disabled(true)
      })
    } else {
      // 注意：data.processDefinition.formCustomViewPath 是组件的全路径，例如说：/crm/contract/detail/index.vue
      BusinessFormComponent.value = registerComponent(data.processDefinition.formCustomViewPath)
    }

    // 加载流程图
    bpmnXml.value = (await DefinitionApi.getProcessDefinition(processDefinition.id))?.bpmnXml
  } finally {
    processInstanceLoading.value = false
  }
}

/** 加载任务列表 */
const getTaskList = async () => {
  runningTask.value = {}
  auditForm.value = {}
  approveForm.value = {}
  approveFormFApi.value = {}
  try {
    // 获得未取消的任务
    tasksLoad.value = true
    const data = await TaskApi.getTaskListByProcessInstanceId(id)
    tasks.value = []
    // 1.1 移除已取消的审批
    data.forEach((task) => {
      if (task.status !== 4) {
        tasks.value.push(task)
      }
    })
    // 1.2 排序，将未完成的排在前面，已完成的排在后面；
    tasks.value.sort((a, b) => {
      // 有已完成的情况，按照完成时间倒序
      if (a.endTime && b.endTime) {
        return b.endTime - a.endTime
      } else if (a.endTime) {
        return 1
      } else if (b.endTime) {
        return -1
        // 都是未完成，按照创建时间倒序
      } else {
        return b.createTime - a.createTime
      }
    })

    // 获得需要自己审批的任务
    loadRunningTask(tasks.value)
  } finally {
    tasksLoad.value = false
  }
}

/**
 * 设置 runningTasks 中的任务
 */
const loadRunningTask = (tasks) => {
  tasks.forEach((task) => {
    if (!isEmpty(task.children)) {
      loadRunningTask(task.children)
    }
    // 2.1 只有待处理才需要
    if (task.status !== 1 && task.status !== 6) {
      return
    }
    // 2.2 自己不是处理人
    if (!task.assigneeUser || task.assigneeUser.id !== userId) {
      return
    }
    // 2.3 添加到处理任务
    runningTask.value = { ...task }
    auditForm.value = {
      reason: '',
      copyUserIds: []
    }

    // 2.4 处理 approve 表单
    if (task.formId && task.formConf) {
      const tempApproveForm = {}
      setConfAndFields2(tempApproveForm, task.formConf, task.formFields, task.formVariables)
      approveForm.value = tempApproveForm
    } else {
      approveForm.value = {} // 占位，避免为空
    }
  })
}

/* 抄送 TODO */
const handleSend = () => {}

const openPopover = (flag) => {
  passVisible.value = false
  rejectVisible.value = false
  formRef.value.resetFields()
  flag === '1' ? (passVisible.value = true) : (rejectVisible.value = true)
}

/** 初始化 */
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
onMounted(async () => {
  getDetail()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>

<style lang="scss" scoped>
.form-box {
  :deep(.el-card) {
    border: none;
  }
}
:deep(.el-affix--fixed) {
  background-color: var(--el-bg-color);
}

.btn-container {
  > div {
    margin: 0 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover {
      color: #6db5ff;
    }
  }
}
</style>
