<template>
  <ContentWrap>
    <!-- 列表 -->
    <XTable @register="registerTable">
      <!-- 流程名称 -->
      <template #name_default="{ row }">
        <XTextButton :title="row.name" @click="handleBpmnDetail(row.id)" />
      </template>
      <!-- 流程分类 -->
      <template #category_default="{ row }">
        <DictTag :type="DICT_TYPE.BPM_MODEL_CATEGORY" :value="Number(row?.category)" />
      </template>
      <!-- 表单信息 -->
      <template #formId_default="{ row }">
        <XTextButton
          v-if="row.formType === 10"
          :title="row.formName"
          @click="handleFormDetail(row)"
        />
        <XTextButton v-else :title="row.formCustomCreatePath" @click="handleFormDetail(row)" />
      </template>
      <!-- 流程版本 -->
      <template #version_default="{ row }">
        <el-tag>v{{ row.version }}</el-tag>
      </template>
      <!-- 激活状态 -->
      <template #suspensionState_default="{ row }">
        <el-tag type="success" v-if="row.suspensionState === 1">激活</el-tag>
        <el-tag type="warning" v-if="row.suspensionState === 2">挂起</el-tag>
      </template>
      <!-- 操作 -->
      <template #actionbtns_default="{ row }">
        <XTextButton
          preIcon="ep:user"
          title="分配规则"
          v-hasPermi="['bpm:task-assign-rule:query']"
          @click="handleAssignRule(row)"
        />
      </template>
    </XTable>

    <!-- 表单详情的弹窗 -->
    <XModal v-model="formDetailVisible" width="800" title="表单详情" :show-footer="false">
      <form-create
        :rule="formDetailPreview.rule"
        :option="formDetailPreview.option"
        v-if="formDetailVisible"
      />
    </XModal>
    <!-- 流程模型图的预览 -->
    <XModal title="流程图" v-model="showBpmnOpen" width="80%" height="90%">
      <my-process-viewer
        key="designer"
        v-model="bpmnXML"
        :value="bpmnXML"
        v-bind="bpmnControlForm"
        :prefix="bpmnControlForm.prefix"
      />
    </XModal>
  </ContentWrap>
</template>
<script setup lang="ts">
// 业务相关的 import
import * as DefinitionApi from '@/api/bpm/definition'
// import * as ModelApi from '@/api/bpm/model'
import { allSchemas } from './definition.data'
import { setConfAndFields2 } from '@/utils/formCreate'
import { DICT_TYPE } from '@/utils/dict'

const bpmnXML = ref(null)
const showBpmnOpen = ref(false)
const bpmnControlForm = ref({
  prefix: 'flowable'
})
// const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const { query } = useRoute() // 查询参数

// ========== 列表相关 ==========
const queryParams = reactive({
  key: query.key
})
const [registerTable] = useXTable({
  allSchemas: allSchemas,
  getListApi: DefinitionApi.getProcessDefinitionPageApi,
  params: queryParams
})

// 流程表单的详情按钮操作
const formDetailVisible = ref(false)
const formDetailPreview = ref({
  rule: [],
  option: {}
})
const handleFormDetail = async (row) => {
  if (row.formType == 10) {
    // 设置表单
    setConfAndFields2(formDetailPreview, row.formConf, row.formFields)
    // 弹窗打开
    formDetailVisible.value = true
  } else {
    await router.push({
      path: row.formCustomCreatePath
    })
  }
}

// 流程图的详情按钮操作
const handleBpmnDetail = (row) => {
  // TODO 芋艿：流程组件开发中
  console.log(row)
  DefinitionApi.getProcessDefinitionBpmnXMLApi(row).then((response) => {
    console.log(response, 'response')
    bpmnXML.value = response
    // 弹窗打开
    showBpmnOpen.value = true
  })
  // message.success('流程组件开发中，预计 2 月底完成')
}

// 点击任务分配按钮
const handleAssignRule = (row) => {
  router.push({
    name: 'BpmTaskAssignRuleList',
    query: {
      processDefinitionId: row.id
    }
  })
}
</script>
