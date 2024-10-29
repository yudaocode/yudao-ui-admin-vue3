<template>
  <ContentWrap :bodyStyle="{ padding: '10px 20px 0' }">
    <div class="processInstance-wrap-main">
      <el-scrollbar>
        <div class="text-#878c93 h-15px">编号：{{ selectProcessDefinition.id }}</div>
        <el-divider class="!my-8px" />

        <div class="flex items-center justify-between gap-5 mb-10px h-40px">
          <div class="text-26px font-bold mb-5px">{{ selectProcessDefinition.name }}</div>
          <el-button style="float: right" type="primary" @click="handleCancel">
            <Icon icon="ep:delete" /> 选择其它流程
          </el-button>
        </div>
        <!-- 中间主要内容tab栏 -->
        <el-tabs v-model="activeTab">
          <!-- 表单信息 -->
          <el-tab-pane label="表单填写" name="form">
            <div class="form-scroll-area">
              <el-scrollbar>
                <el-row>
                  <el-col :span="17">
                    <form-create
                      :rule="detailForm.rule"
                      v-model:api="fApi"
                      v-model="detailForm.value"
                      :option="detailForm.option"
                      @submit="submitForm"
                    >
                      <template #type-startUserSelect>
                        <el-col :span="24">
                          <el-card class="mb-10px">
                            <template #header>指定审批人</template>
                            <el-form
                              :model="startUserSelectAssignees"
                              :rules="startUserSelectAssigneesFormRules"
                              ref="startUserSelectAssigneesFormRef"
                            >
                              <el-form-item
                                v-for="userTask in startUserSelectTasks"
                                :key="userTask.id"
                                :label="`任务【${userTask.name}】`"
                                :prop="userTask.id"
                              >
                                <el-select
                                  v-model="startUserSelectAssignees[userTask.id]"
                                  multiple
                                  placeholder="请选择审批人"
                                >
                                  <el-option
                                    v-for="user in userList"
                                    :key="user.id"
                                    :label="user.nickname"
                                    :value="user.id"
                                  />
                                </el-select>
                              </el-form-item>
                            </el-form>
                          </el-card>
                        </el-col>
                      </template>
                    </form-create>
                  </el-col>

                  <el-col :span="6" :offset="1">
                    <!-- 流程时间线 -->
                    <ProcessInstanceTimeline
                      ref="timelineRef"
                      :approve-nodes="approveNodes"
                      :show-status-icon="false"
                      candidateField="candidateUserList"
                    />
                  </el-col>
                </el-row>
              </el-scrollbar>
            </div>
          </el-tab-pane>
          <!-- 流程图 -->
          <el-tab-pane label="流程图" name="diagram">
            <div class="form-scroll-area">
              <!-- 流程图预览 -->
              <ProcessInstanceBpmnViewer :bpmn-xml="bpmnXML" />
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
import { setConfAndFields2 } from '@/utils/formCreate'
import ProcessInstanceBpmnViewer from '../detail/ProcessInstanceBpmnViewer.vue'
import ProcessInstanceTimeline from '../detail/ProcessInstanceTimeline.vue'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as DefinitionApi from '@/api/bpm/definition'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'ProcessDefinitionDetail' })
const props = defineProps<{
  selectProcessDefinition: any
}>()
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
const startUserSelectAssigneesFormRef = ref() // 发起人选择审批人的表单 Ref
const startUserSelectTasks: any = ref([]) // 发起人需要选择审批人的用户任务列表
const startUserSelectAssignees = ref({}) // 发起人选择审批人的数据
const startUserSelectAssigneesFormRules = ref({}) // 发起人选择审批人的表单 Rules
const userList = ref<any[]>([]) // 用户列表
const bpmnXML: any = ref(null) // BPMN 数据
/** 当前的Tab */
const activeTab = ref('form')
const emit = defineEmits(['cancel'])
// 审批节点信息
const approveNodes = ref<ProcessInstanceApi.ApprovalNodeInfo[]>([])

/** 设置表单信息、获取流程图数据 **/
const initProcessInfo = async (row, formVariables?) => {
  // 重置指定审批人
  startUserSelectTasks.value = []
  startUserSelectAssignees.value = {}
  startUserSelectAssigneesFormRules.value = {}

  // 情况一：流程表单
  if (row.formType == 10) {
    // 设置表单
    setConfAndFields2(detailForm, row.formConf, row.formFields, formVariables)
    await nextTick()
    fApi.value?.btn.show(false) // 隐藏提交按钮
    // 获取流程审批信息
    getApprovalDetail(row)

    // 加载流程图
    const processDefinitionDetail = await DefinitionApi.getProcessDefinition(row.id)
    if (processDefinitionDetail) {
      bpmnXML.value = processDefinitionDetail.bpmnXml
      startUserSelectTasks.value = processDefinitionDetail.startUserSelectTasks

      // 设置指定审批人
      if (startUserSelectTasks.value?.length > 0) {
        detailForm.value.rule.push({
          type: 'startUserSelect',
          props: {
            title: '指定审批人'
          }
        })
        // 设置校验规则
        for (const userTask of startUserSelectTasks.value) {
          startUserSelectAssignees.value[userTask.id] = []
          startUserSelectAssigneesFormRules.value[userTask.id] = [
            { required: true, message: '请选择审批人', trigger: 'blur' }
          ]
        }
        // 加载用户列表
        userList.value = await UserApi.getSimpleUserList()
      }
    }
    // 情况二：业务表单
  } else if (row.formCustomCreatePath) {
    await push({
      path: row.formCustomCreatePath
    })
    // 这里暂时无需加载流程图，因为跳出到另外个 Tab；
  }
}

/** 获取审批详情 */
const getApprovalDetail = async (row) => {
  try {
    const param = {
      processDefinitionId: row.id
    }
    const data = await ProcessInstanceApi.getApprovalDetail(param)
    if (!data) {
      message.error('查询不到审批详情信息！')
      return
    }
    // 获取审批节点，显示 Timeline 的数据
    approveNodes.value = data.approveNodes
  } finally {
  }
}
/** 提交按钮 */
const submitForm = async (formData) => {
  if (!fApi.value || props.selectProcessDefinition) {
    return
  }
  // 如果有指定审批人，需要校验
  if (startUserSelectTasks.value?.length > 0) {
    await startUserSelectAssigneesFormRef.value.validate()
  }

  // 提交请求
  fApi.value.btn.loading(true)
  try {
    await ProcessInstanceApi.createProcessInstance({
      processDefinitionId: props.selectProcessDefinition.id,
      variables: formData || detailForm.value.value,
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
    fApi.value.btn.loading(false)
  }
}

const handleCancel = () => {
  emit('cancel')
}

defineExpose({ initProcessInfo })
</script>

<style lang="scss" scoped>
$wrap-padding-height: 20px;
$wrap-margin-height: 15px;
$button-height: 51px;
$process-header-height: 194px;

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
