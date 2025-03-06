<template>
  <ContentWrap :bodyStyle="{ padding: '10px 20px 0' }">
    <div class="processInstance-wrap-main">
      <el-scrollbar>
        <div class="text-#878c93 h-15px">流程：{{ selectProcessDefinition.name }}</div>
        <el-divider class="!my-8px" />

        <!-- 中间主要内容 tab 栏 -->
        <el-tabs v-model="activeTab">
          <!-- 表单信息 -->
          <el-tab-pane label="表单填写" name="form">
            <div class="form-scroll-area" v-loading="processInstanceStartLoading">
              <el-scrollbar>
                <el-row>
                  <el-col :span="17">
                    <form-create
                      :rule="detailForm.rule"
                      v-model:api="fApi"
                      v-model="detailForm.value"
                      :option="detailForm.option"
                      @submit="submitForm"
                    />
                  </el-col>

                  <el-col :span="6" :offset="1">
                    <!-- 流程时间线 -->
                    <ProcessInstanceTimeline
                      ref="timelineRef"
                      :activity-nodes="activityNodes"
                      :show-status-icon="false"
                      @select-user-confirm="selectUserConfirm"
                    />
                  </el-col>
                </el-row>
              </el-scrollbar>
            </div>
          </el-tab-pane>
          <!-- 流程图 -->
          <el-tab-pane label="流程图" name="diagram">
            <div class="form-scroll-area">
              <!-- BPMN 流程图预览 -->
              <ProcessInstanceBpmnViewer
                :bpmn-xml="bpmnXML"
                v-if="BpmModelType.BPMN === selectProcessDefinition.modelType"
              />

              <!-- Simple 流程图预览 -->
              <ProcessInstanceSimpleViewer
                :simple-json="simpleJson"
                v-if="BpmModelType.SIMPLE === selectProcessDefinition.modelType"
              />
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 底部操作栏 -->
        <div class="b-t-solid border-t-1px border-[var(--el-border-color)]">
          <!-- 操作栏按钮 -->
          <div
            v-if="activeTab === 'form'"
            class="h-50px bottom-10 text-14px flex items-center color-#32373c dark:color-#fff font-bold btn-container"
          >
            <el-button plain type="success" @click="submitForm">
              <Icon icon="ep:select" />&nbsp; 发起
            </el-button>
            <el-button plain type="danger" @click="handleCancel">
              <Icon icon="ep:close" />&nbsp; 取消
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { decodeFields, setConfAndFields2 } from '@/utils/formCreate'
import { BpmModelType, BpmModelFormType } from '@/utils/constants'
import {
  CandidateStrategy,
  NodeId,
  FieldPermissionType
} from '@/components/SimpleProcessDesignerV2/src/consts'
import ProcessInstanceBpmnViewer from '../detail/ProcessInstanceBpmnViewer.vue'
import ProcessInstanceSimpleViewer from '../detail/ProcessInstanceSimpleViewer.vue'
import ProcessInstanceTimeline from '../detail/ProcessInstanceTimeline.vue'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as DefinitionApi from '@/api/bpm/definition'
import { ApprovalNodeInfo } from '@/api/bpm/processInstance'

defineOptions({ name: 'ProcessDefinitionDetail' })
const props = defineProps<{
  selectProcessDefinition: any
}>()
const emit = defineEmits(['cancel'])
const processInstanceStartLoading = ref(false) // 流程实例发起中
const { push, currentRoute } = useRouter() // 路由
const message = useMessage() // 消息弹窗
const { delView } = useTagsViewStore() // 视图操作

const detailForm: any = ref({
  rule: [],
  option: {},
  value: {}
}) // 流程表单详情
const fApi = ref<ApiAttrs>()
// 指定审批人
const startUserSelectTasks: any = ref([]) // 发起人需要选择审批人或抄送人的任务列表
const startUserSelectAssignees = ref({}) // 发起人选择审批人的数据
const tempStartUserSelectAssignees = ref({}) // 历史发起人选择审批人的数据，用于每次表单变更时，临时保存
const bpmnXML: any = ref(null) // BPMN 数据
const simpleJson = ref<string | undefined>() // Simple 设计器数据 json 格式

const activeTab = ref('form') // 当前的 Tab
const activityNodes = ref<ProcessInstanceApi.ApprovalNodeInfo[]>([]) // 审批节点信息

/** 设置表单信息、获取流程图数据 **/
const initProcessInfo = async (row: any, formVariables?: any) => {
  // 重置指定审批人
  startUserSelectTasks.value = []
  startUserSelectAssignees.value = {}

  // 情况一：流程表单
  if (row.formType == BpmModelFormType.NORMAL) {
    // 设置表单
    // 注意：需要从 formVariables 中，移除不在 row.formFields 的值。
    // 原因是：后端返回的 formVariables 里面，会有一些非表单的信息。例如说，某个流程节点的审批人。
    //        这样，就可能导致一个流程被审批不通过后，重新发起时，会直接后端报错！！！
    const allowedFields = decodeFields(row.formFields).map((fieldObj: any) => fieldObj.field)
    for (const key in formVariables) {
      if (!allowedFields.includes(key)) {
        delete formVariables[key]
      }
    }
    setConfAndFields2(detailForm, row.formConf, row.formFields, formVariables)

    await nextTick()
    fApi.value?.btn.show(false) // 隐藏提交按钮

    // 获取流程审批信息,当再次发起时，流程审批节点要根据原始表单参数预测出来
    await getApprovalDetail({
      id: row.id,
      processVariablesStr: JSON.stringify(formVariables)
    })

    // 加载流程图
    const processDefinitionDetail = await DefinitionApi.getProcessDefinition(row.id)
    if (processDefinitionDetail) {
      bpmnXML.value = processDefinitionDetail.bpmnXml
      simpleJson.value = processDefinitionDetail.simpleModel
    }
    // 情况二：业务表单
  } else if (row.formCustomCreatePath) {
    await push({
      path: row.formCustomCreatePath
    })
    // 这里暂时无需加载流程图，因为跳出到另外个 Tab；
  }
}

/** 预测流程节点会因为输入的参数值而产生新的预测结果值，所以需重新预测一次 */
watch(
  detailForm.value,
  (newValue) => {
    if (newValue && Object.keys(newValue.value).length > 0) {
      // 记录之前的节点审批人
      tempStartUserSelectAssignees.value = startUserSelectAssignees.value
      startUserSelectAssignees.value = {}
      // 加载最新的审批详情
      getApprovalDetail({
        id: props.selectProcessDefinition.id,
        processVariablesStr: JSON.stringify(newValue.value) // 解决 GET 无法传递对象的问题，后端 String 再转 JSON
      })
    }
  },
  {
    immediate: true
  }
)

/** 获取审批详情 */
const getApprovalDetail = async (row: any) => {
  try {
    // TODO 获取审批详情，设置 activityId 为发起人节点（为了获取字段权限。暂时只对 Simple 设计器有效）；@jason：这里可以去掉 activityId 么？
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

    // 获取表单字段权限
    const formFieldsPermission = data.formFieldsPermission
    // 设置表单字段权限
    if (formFieldsPermission) {
      Object.keys(formFieldsPermission).forEach((item) => {
        setFieldPermission(item, formFieldsPermission[item])
      })
    }
  } finally {
  }
}

/**
 * 设置表单权限
 */
const setFieldPermission = (field: string, permission: string) => {
  if (permission === FieldPermissionType.READ) {
    //@ts-ignore
    fApi.value?.disabled(true, field)
  }
  if (permission === FieldPermissionType.WRITE) {
    //@ts-ignore
    fApi.value?.disabled(false, field)
  }
  if (permission === FieldPermissionType.NONE) {
    //@ts-ignore
    fApi.value?.hidden(true, field)
  }
}

/** 提交按钮 */
const submitForm = async () => {
  if (!fApi.value || !props.selectProcessDefinition) {
    return
  }
  // 流程表单校验
  await fApi.value.validate()
  // 如果有指定审批人，需要校验
  if (startUserSelectTasks.value?.length > 0) {
    for (const userTask of startUserSelectTasks.value) {
      if (
        Array.isArray(startUserSelectAssignees.value[userTask.id]) &&
        startUserSelectAssignees.value[userTask.id].length === 0
      )
        return message.warning(`请选择${userTask.name}的候选人`)
    }
  }

  // 提交请求
  processInstanceStartLoading.value = true
  try {
    await ProcessInstanceApi.createProcessInstance({
      processDefinitionId: props.selectProcessDefinition.id,
      variables: detailForm.value.value,
      startUserSelectAssignees: startUserSelectAssignees.value
    })
    // 提示
    message.success('发起流程成功')
    // 跳转回去
    delView(unref(currentRoute))
    await push({
      name: 'BpmProcessInstanceMy'
    })
  } finally {
    processInstanceStartLoading.value = false
  }
}

/** 取消发起审批 */
const handleCancel = () => {
  emit('cancel')
}

/** 选择发起人 */
const selectUserConfirm = (id: string, userList: any[]) => {
  startUserSelectAssignees.value[id] = userList?.map((item: any) => item.id)
}

defineExpose({ initProcessInfo })
</script>

<style lang="scss" scoped>
$wrap-padding-height: 20px;
$wrap-margin-height: 15px;
$button-height: 51px;
$process-header-height: 105px;

.processInstance-wrap-main {
  height: calc(
    100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 35px
  );
  max-height: calc(
    100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 35px
  );
  overflow: auto;

  .form-scroll-area {
    height: calc(
      100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 35px -
        $process-header-height - 40px
    );
    max-height: calc(
      100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) - 35px -
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
