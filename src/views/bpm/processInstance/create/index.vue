<template>
  <doc-alert title="流程发起、取消、重新发起" url="https://doc.iocoder.cn/bpm/process-instance/" />

  <!-- 第一步，通过流程定义的列表，选择对应的流程 -->
  <ContentWrap v-if="!selectProcessDefinition" v-loading="loading">
    <el-tabs tab-position="left" v-model="categoryActive">
      <el-tab-pane
        :label="category.name"
        :name="category.code"
        :key="category.code"
        v-for="category in categoryList"
      >
        <el-row :gutter="20">
          <el-col
            :lg="6"
            :sm="12"
            :xs="24"
            v-for="definition in categoryProcessDefinitionList"
            :key="definition.id"
          >
            <el-card
              shadow="hover"
              class="mb-20px cursor-pointer"
              @click="handleSelect(definition)"
            >
              <template #default>
                <div class="flex">
                  <el-image :src="definition.icon" class="w-32px h-32px" />
                  <el-text class="!ml-10px" size="large">{{ definition.name }}</el-text>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>

  <!-- 第二步，填写表单，进行流程的提交 -->
  <ContentWrap v-else>
    <el-card class="box-card">
      <div class="clearfix">
        <span class="el-icon-document">申请信息【{{ selectProcessDefinition.name }}】</span>
        <el-button style="float: right" type="primary" @click="selectProcessDefinition = undefined">
          <Icon icon="ep:delete" /> 选择其它流程
        </el-button>
      </div>
      <el-col :span="16" :offset="6" style="margin-top: 20px">
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
    </el-card>
    <!-- 流程图预览 -->
    <ProcessInstanceBpmnViewer :bpmn-xml="bpmnXML as any" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { setConfAndFields2 } from '@/utils/formCreate'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import ProcessInstanceBpmnViewer from '../detail/ProcessInstanceBpmnViewer.vue'
import { CategoryApi } from '@/api/bpm/category'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const route = useRoute() // 路由
const { push, currentRoute } = useRouter() // 路由
const message = useMessage() // 消息
const { delView } = useTagsViewStore() // 视图操作

const processInstanceId = route.query.processInstanceId
const loading = ref(true) // 加载中
const categoryList = ref([]) // 分类的列表
const categoryActive = ref('') // 选中的分类
const processDefinitionList = ref([]) // 流程定义的列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 流程分类
    categoryList.value = await CategoryApi.getCategorySimpleList()
    if (categoryList.value.length > 0) {
      categoryActive.value = categoryList.value[0].code
    }
    // 流程定义
    processDefinitionList.value = await DefinitionApi.getProcessDefinitionList({
      suspensionState: 1
    })

    // 如果 processInstanceId 非空，说明是重新发起
    if (processInstanceId?.length > 0) {
      const processInstance = await ProcessInstanceApi.getProcessInstance(processInstanceId)
      if (!processInstance) {
        message.error('重新发起流程失败，原因：流程实例不存在')
        return
      }
      const processDefinition = processDefinitionList.value.find(
        (item) => item.key == processInstance.processDefinition?.key
      )
      if (!processDefinition) {
        message.error('重新发起流程失败，原因：流程定义不存在')
        return
      }
      await handleSelect(processDefinition, processInstance.formVariables)
    }
  } finally {
    loading.value = false
  }
}

/** 选中分类对应的流程定义列表 */
const categoryProcessDefinitionList = computed(() => {
  return processDefinitionList.value.filter((item) => item.category == categoryActive.value)
})

// ========== 表单相关 ==========
const fApi = ref<ApiAttrs>()
const detailForm = ref({
  rule: [],
  option: {},
  value: {}
}) // 流程表单详情
const selectProcessDefinition = ref() // 选择的流程定义

// 指定审批人
const bpmnXML = ref(null) // BPMN 数据
const startUserSelectTasks = ref([]) // 发起人需要选择审批人的用户任务列表
const startUserSelectAssignees = ref({}) // 发起人选择审批人的数据
const startUserSelectAssigneesFormRef = ref() // 发起人选择审批人的表单 Ref
const startUserSelectAssigneesFormRules = ref({}) // 发起人选择审批人的表单 Rules
const userList = ref<any[]>([]) // 用户列表

/** 处理选择流程的按钮操作 **/
const handleSelect = async (row, formVariables) => {
  // 设置选择的流程
  selectProcessDefinition.value = row

  // 重置指定审批人
  startUserSelectTasks.value = []
  startUserSelectAssignees.value = {}
  startUserSelectAssigneesFormRules.value = {}

  // 情况一：流程表单
  if (row.formType == 10) {
    // 设置表单
    setConfAndFields2(detailForm, row.formConf, row.formFields, formVariables)
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

/** 提交按钮 */
const submitForm = async (formData) => {
  if (!fApi.value || !selectProcessDefinition.value) {
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
      processDefinitionId: selectProcessDefinition.value.id,
      variables: formData,
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

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
