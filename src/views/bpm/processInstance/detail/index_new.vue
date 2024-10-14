<template>
  <ContentWrap :bodyStyle="{ padding: '10px 20px' }" class="position-relative">
    <div class="processInstance-wrap-main">
      <el-scrollbar>
        <img
          class="position-absolute right-20px"
          width="150"
          :src="auditIcons[processInstance.status]"
          alt=""
        />
        <div class="text-#878c93 h-15px">编号：{{ id }}</div>
        <el-divider class="!my-8px" />
        <div class="flex items-center gap-5 mb-10px h-40px">
          <div class="text-26px font-bold mb-5px">{{ processInstance.name }}</div>
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="processInstance.status" />
        </div>

        <div class="flex items-center gap-5 mb-10px text-13px h-35px">
          <div
            class="bg-gray-100 h-35px rounded-3xl flex items-center p-8px gap-2 dark:color-gray-600"
          >
            <img class="rounded-full h-28px" src="@/assets/imgs/avatar.jpg" alt="" />
            {{ processInstance?.startUser?.nickname }}
          </div>
          <div class="text-#878c93"> {{ formatDate(processInstance.startTime) }} 提交 </div>
        </div>

        <el-tabs v-model="activeTab">
          <!-- 表单信息 -->
          <el-tab-pane label="审批详情" name="form">
            <div class="form-scroll-area">
              <el-scrollbar>
                <el-row :gutter="10">
                  <el-col :span="18" class="!flex !flex-col formCol">
                    <!-- 表单信息 -->
                    <div
                      v-loading="processInstanceLoading"
                      class="form-box flex flex-col mb-30px flex-1"
                    >
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
                  </el-col>
                  <el-col :span="6">
                    <!-- 审批记录时间线 -->
                    <ProcessInstanceTimeline ref="timelineRef" :process-instance-id="id" />
                  </el-col>
                </el-row>
              </el-scrollbar>
            </div>
          </el-tab-pane>
          <!-- 流程图 -->
          <el-tab-pane label="流程图" name="diagram">
            <ProcessInstanceBpmnViewer
              :id="`${id}`"
              :bpmn-xml="bpmnXml"
              :loading="processInstanceLoading"
              :process-instance="processInstance"
              :tasks="tasks"
            />
          </el-tab-pane>
          <!-- 流转记录 -->
          <el-tab-pane label="流转记录" name="record">
            <ProcessInstanceTaskList
              :loading="tasksLoad"
              :process-instance="processInstance"
              :tasks="tasks"
              @refresh="getTaskList"
            />
          </el-tab-pane>
          <!-- 流转评论 TODO 待开发 -->
          <el-tab-pane label="流转评论" name="comment"> 流转评论 </el-tab-pane>
        </el-tabs>

        <div
          class="b-t-solid border-t-1px border-[var(--el-border-color)]"
          v-if="activeTab === 'form'"
        >
          <!-- 操作栏按钮 -->
          <ProcessInstanceOperationButton
            ref="operationButtonRef"
            :processInstance="processInstance"
            :userOptions="userOptions"
            @success="refresh"
          />
        </div>
      </el-scrollbar>
    </div>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { setConfAndFields2 } from '@/utils/formCreate'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as TaskApi from '@/api/bpm/task'
import ProcessInstanceBpmnViewer from './ProcessInstanceBpmnViewer.vue'
import ProcessInstanceTaskList from './ProcessInstanceTaskList.vue'
import ProcessInstanceOperationButton from './ProcessInstanceOperationButton.vue'
import ProcessInstanceTimeline from './ProcessInstanceTimeline.vue'
import { registerComponent } from '@/utils/routerHelper'
import * as UserApi from '@/api/system/user'
import { FieldPermissionType } from '@/components/SimpleProcessDesignerV2/src/consts'
import audit1 from '@/assets/svgs/bpm/audit1.svg'
import audit2 from '@/assets/svgs/bpm/audit2.svg'
import audit3 from '@/assets/svgs/bpm/audit3.svg'

defineOptions({ name: 'BpmProcessInstanceDetail' })
const props = defineProps<{
  id: string // 流程实例的编号
  taskId?: string // 任务编号
  activityId?: string //流程活动编号，用于抄送查看
}>()
const message = useMessage() // 消息弹窗
const processInstanceLoading = ref(false) // 流程实例的加载中
const processInstance = ref<any>({}) // 流程实例
const operationButtonRef = ref()
const timelineRef = ref()
const bpmnXml = ref('') // BPMN XML
const tasksLoad = ref(true) // 任务的加载中
const tasks = ref<any[]>([]) // 任务列表
const auditIcons = {
  1: audit1,
  2: audit2,
  3: audit3
}

// ========== 申请信息 ==========
const fApi = ref<ApiAttrs>() //
const detailForm = ref({
  rule: [],
  option: {},
  value: {}
}) // 流程实例的表单详情

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
    const data = await ProcessInstanceApi.getProcessInstance(props.id)
    if (!data) {
      message.error('查询不到流程信息！')
      return
    }
    processInstance.value = data

    // 设置表单信息
    const processDefinition = data.processDefinition
    if (processDefinition.formType === 10) {
      // 获取表单字段权限
      let fieldsPermission = undefined
      if (props.taskId || props.activityId) {
        fieldsPermission = await ProcessInstanceApi.getFormFieldsPermission({
          processInstanceId: props.id,
          taskId: props.taskId,
          activityId: props.activityId
        })
      }
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
        if (fieldsPermission) {
          Object.keys(fieldsPermission).forEach((item) => {
            setFieldPermission(item, fieldsPermission[item])
          })
        }
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

/**
 * 设置表单权限
 */
const setFieldPermission = (field: string, permission: string) => {
  if (permission === FieldPermissionType.READ) {
    fApi.value?.disabled(true, field)
  }
  if (permission === FieldPermissionType.WRITE) {
    fApi.value?.disabled(false, field)
  }
  if (permission === FieldPermissionType.NONE) {
    fApi.value?.hidden(true, field)
  }
}

/** 加载任务列表 */
const getTaskList = async () => {
  try {
    // 获得未取消的任务
    tasksLoad.value = true
    const data = await TaskApi.getTaskListByProcessInstanceId(props.id)
    tasks.value = []
    // 1.1 移除已取消的审批
    data.forEach((task: any) => {
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
    operationButtonRef.value?.loadRunningTask(tasks.value)
  } finally {
    tasksLoad.value = false
  }
}

/**
 * 操作成功后刷新
 */
const refresh = () => {
  // 重新获取详情
  getDetail()
  // 刷新审批详情 Timeline
  timelineRef.value?.refresh()
}

/** 当前的Tab */
const activeTab = ref('form')

/** 初始化 */
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
onMounted(async () => {
  getDetail()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>

<style lang="scss" scoped>
$wrap-padding-height: 30px;
$wrap-margin-height: 15px;
$button-height: 51px;
$process-header-height: 194px;

.processInstance-wrap-main {
  height: calc(
    100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 45px
  );
  max-height: calc(
    100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 45px
  );
  overflow: auto;

  .form-scroll-area {
    height: calc(
      100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 45px -
        $process-header-height - 40px
    );
    max-height: calc(
      100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 45px -
        $process-header-height - 40px
    );
    overflow: auto;
  }
}

.form-box {
  :deep(.el-card) {
    border: none;
  }
}
</style>
