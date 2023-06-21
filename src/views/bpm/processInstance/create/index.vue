<template>
  <!-- 第一步，通过流程定义的列表，选择对应的流程 -->
  <ContentWrap v-if="!selectProcessInstance">
    <el-table v-loading="loading" :data="list">
      <el-table-column label="流程名称" align="center" prop="name" />
      <el-table-column label="流程分类" align="center" prop="category">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_MODEL_CATEGORY" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column label="流程版本" align="center" prop="version">
        <template #default="scope">
          <el-tag>v{{ scope.row.version }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="流程描述" align="center" prop="description" />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button link type="primary" @click="handleSelect(scope.row)">
            <Icon icon="ep:plus" /> 选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 第二步，填写表单，进行流程的提交 -->
  <ContentWrap v-else>
    <el-card class="box-card">
      <div class="clearfix">
        <span class="el-icon-document">申请信息【{{ selectProcessInstance.name }}】</span>
        <el-button style="float: right" type="primary" @click="selectProcessInstance = undefined">
          <Icon icon="ep:delete" /> 选择其它流程
        </el-button>
      </div>
      <el-col :span="16" :offset="6" style="margin-top: 20px">
        <form-create
          :rule="detailForm.rule"
          v-model:api="fApi"
          :option="detailForm.option"
          @submit="submitForm"
        />
      </el-col>
    </el-card>
    <!-- 流程图预览 -->
    <ProcessInstanceBpmnViewer :bpmn-xml="bpmnXML as any" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { setConfAndFields2 } from '@/utils/formCreate'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import ProcessInstanceBpmnViewer from '../detail/ProcessInstanceBpmnViewer.vue'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const router = useRouter() // 路由
const message = useMessage() // 消息

// ========== 列表相关 ==========
const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const queryParams = reactive({
  suspensionState: 1
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await DefinitionApi.getProcessDefinitionList(queryParams)
  } finally {
    loading.value = false
  }
}

// ========== 表单相关 ==========
const bpmnXML = ref(null) // BPMN 数据
const fApi = ref<ApiAttrs>()
const detailForm = ref({
  // 流程表单详情
  rule: [],
  option: {}
})
const selectProcessInstance = ref() // 选择的流程实例

/** 处理选择流程的按钮操作 **/
const handleSelect = async (row) => {
  // 设置选择的流程
  selectProcessInstance.value = row

  // 情况一：流程表单
  if (row.formType == 10) {
    // 设置表单
    setConfAndFields2(detailForm, row.formConf, row.formFields)
    // 加载流程图
    bpmnXML.value = await DefinitionApi.getProcessDefinitionBpmnXML(row.id)
    // 情况二：业务表单
  } else if (row.formCustomCreatePath) {
    await router.push({
      path: row.formCustomCreatePath
    })
    // 这里暂时无需加载流程图，因为跳出到另外个 Tab；
  }
}

/** 提交按钮 */
const submitForm = async (formData) => {
  if (!fApi.value || !selectProcessInstance.value) {
    return
  }
  // 提交请求
  fApi.value.btn.loading(true)
  try {
    await ProcessInstanceApi.createProcessInstance({
      processDefinitionId: selectProcessInstance.value.id,
      variables: formData
    })
    // 提示
    message.success('发起流程成功')
    router.go(-1)
  } finally {
    fApi.value.btn.loading(false)
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
