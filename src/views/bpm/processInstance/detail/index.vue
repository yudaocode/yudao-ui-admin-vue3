<template>
  <ContentWrap>
    <!-- 审批信息 -->
    <el-card
      class="box-card"
      v-loading="processInstanceLoading"
      v-for="(item, index) in runningTasks"
      :key="index"
    >
      <template #header>
        <span class="el-icon-picture-outline">审批任务【{{ item.name }}】</span>
      </template>
      <el-col :span="16" :offset="6">
        <el-form
          :ref="'form' + index"
          :model="auditForms[index]"
          :rules="auditRule"
          label-width="100px"
        >
          <el-form-item label="流程名" v-if="processInstance && processInstance.name">
            {{ processInstance.name }}
          </el-form-item>
          <el-form-item label="流程发起人" v-if="processInstance && processInstance.startUser">
            {{ processInstance.startUser.nickname }}
            <el-tag type="info" size="small">{{ processInstance.startUser.deptName }}</el-tag>
          </el-form-item>
          <el-form-item label="审批建议" prop="reason">
            <el-input
              type="textarea"
              v-model="auditForms[index].reason"
              placeholder="请输入审批建议"
            />
          </el-form-item>
        </el-form>
        <div style="margin-left: 10%; margin-bottom: 20px; font-size: 14px">
          <el-button type="success" @click="handleAudit(item, true)">
            <Icon icon="ep:select" /> 通过
          </el-button>
          <el-button type="danger" @click="handleAudit(item, false)">
            <Icon icon="ep:close" /> 不通过
          </el-button>
          <el-button type="primary" @click="openTaskUpdateAssigneeForm(item.id)">
            <Icon icon="ep:edit" /> 转办
          </el-button>
          <el-button type="primary" @click="handleDelegate(item)">
            <Icon icon="ep:position" /> 委派
          </el-button>
          <el-button type="warning" @click="handleBack(item)">
            <Icon icon="ep:back" /> 回退
          </el-button>
        </div>
      </el-col>
    </el-card>

    <!-- 申请信息 -->
    <el-card class="box-card" v-loading="processInstanceLoading">
      <template #header>
        <span class="el-icon-document">申请信息【{{ processInstance.name }}】</span>
      </template>
      <!-- 情况一：流程表单 -->
      <el-col v-if="processInstance?.processDefinition?.formType === 10" :span="16" :offset="6">
        <form-create
          ref="fApi"
          :rule="detailForm.rule"
          :option="detailForm.option"
          v-model="detailForm.value"
        />
      </el-col>
      <!-- 情况二：流程表单 -->
      <div v-if="processInstance?.processDefinition?.formType === 20">
        <router-link
          :to="
            processInstance.processDefinition.formCustomViewPath +
            '?id=' +
            processInstance.businessKey
          "
        >
          <el-button type="primary"><Icon icon="ep:view" /> 点击查看</el-button>
        </router-link>
      </div>
    </el-card>

    <!-- 审批记录 -->
    <ProcessInstanceTaskList :loading="tasksLoad" :tasks="tasks" />

    <!-- 高亮流程图 -->
    <ProcessInstanceBpmnViewer
      :id="id"
      :process-instance="processInstance"
      :loading="processInstanceLoading"
      :tasks="tasks"
      :bpmn-xml="bpmnXML"
    />

    <!-- 弹窗：转派审批人 -->
    <TaskUpdateAssigneeForm ref="taskUpdateAssigneeFormRef" @success="getDetail" />
  </ContentWrap>
</template>
<script setup lang="ts">
import { useUserStore } from '@/store/modules/user'
import { setConfAndFields2 } from '@/utils/formCreate'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as TaskApi from '@/api/bpm/task'
import TaskUpdateAssigneeForm from './TaskUpdateAssigneeForm.vue'
import ProcessInstanceBpmnViewer from './ProcessInstanceBpmnViewer.vue'
import ProcessInstanceTaskList from './ProcessInstanceTaskList.vue'
const { query } = useRoute() // 查询参数
const message = useMessage() // 消息弹窗
const { proxy } = getCurrentInstance() as any

const userId = useUserStore().getUser.id // 当前登录的编号
const id = query.id as unknown as number // 流程实例的编号
const processInstanceLoading = ref(false) // 流程实例的加载中
const processInstance = ref<any>({}) // 流程实例
const bpmnXML = ref('') // BPMN XML
const tasksLoad = ref(true) // 任务的加载中
const tasks = ref<any[]>([]) // 任务列表
// ========== 审批信息 ==========
const runningTasks = ref<any[]>([]) // 运行中的任务
const auditForms = ref<any[]>([]) // 审批任务的表单
const auditRule = reactive({
  reason: [{ required: true, message: '审批建议不能为空', trigger: 'blur' }]
})
// ========== 申请信息 ==========
const fApi = ref<ApiAttrs>() //
const detailForm = ref({
  // 流程表单详情
  rule: [],
  option: {},
  value: {}
})

/** 处理审批通过和不通过的操作 */
const handleAudit = async (task, pass) => {
  // 1.1 获得对应表单
  const index = runningTasks.value.indexOf(task)
  const auditFormRef = proxy.$refs['form' + index][0]
  // 1.2 校验表单
  const elForm = unref(auditFormRef)
  if (!elForm) return
  const valid = await elForm.validate()
  if (!valid) return

  // 2.1 提交审批
  const data = {
    id: task.id,
    reason: auditForms.value[index].reason
  }
  if (pass) {
    await TaskApi.approveTask(data)
    message.success('审批通过成功')
  } else {
    await TaskApi.rejectTask(data)
    message.success('审批不通过成功')
  }
  // 2.2 加载最新数据
  getDetail()
}

/** 转派审批人 */
const taskUpdateAssigneeFormRef = ref()
const openTaskUpdateAssigneeForm = (id: string) => {
  taskUpdateAssigneeFormRef.value.open(id)
}

/** 处理审批退回的操作 */
const handleDelegate = async (task) => {
  message.error('暂不支持【委派】功能，可以使用【转派】替代！')
  console.log(task)
}

/** 处理审批退回的操作 */
const handleBack = async (task) => {
  message.error('暂不支持【退回】功能！')
  console.log(task)
}

/** 获得详情 */
const getDetail = () => {
  // 1. 获得流程实例相关
  getProcessInstance()
  // 2. 获得流程任务列表（审批记录）
  getTaskList()
}

/** 加载流程实例 */
const getProcessInstance = async () => {
  try {
    processInstanceLoading.value = true
    const data = await ProcessInstanceApi.getProcessInstanceApi(id)
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
        fApi.value?.fapi?.btn.show(false)
        fApi.value?.fapi?.resetBtn.show(false)
        fApi.value?.fapi?.disabled(true)
      })
    }

    // 加载流程图
    bpmnXML.value = await DefinitionApi.getProcessDefinitionBpmnXML(processDefinition.id)
  } finally {
    processInstanceLoading.value = false
  }
}

/** 加载任务列表 */
const getTaskList = async () => {
  try {
    // 获得未取消的任务
    tasksLoad.value = true
    const data = await TaskApi.getTaskListByProcessInstanceId(id)
    tasks.value = []
    // 1.1 移除已取消的审批
    data.forEach((task) => {
      if (task.result !== 4) {
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
    runningTasks.value = []
    auditForms.value = []
    tasks.value.forEach((task) => {
      // 2.1 只有待处理才需要
      if (task.result !== 1) {
        return
      }
      // 2.2 自己不是处理人
      if (!task.assigneeUser || task.assigneeUser.id !== userId) {
        return
      }
      // 2.3 添加到处理任务
      runningTasks.value.push({ ...task })
      auditForms.value.push({
        reason: ''
      })
    })
  } finally {
    tasksLoad.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
