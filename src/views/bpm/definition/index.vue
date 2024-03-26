<template>
  <doc-alert title="工作流手册" url="https://doc.iocoder.cn/bpm/" />

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="定义编号" prop="id" width="400" />
      <el-table-column align="center" label="流程名称" prop="name" width="200">
        <template #default="scope">
          <el-button link type="primary" @click="handleBpmnDetail(scope.row)">
            <span>{{ scope.row.name }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="定义分类" prop="category" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_MODEL_CATEGORY" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="表单信息" prop="formType" width="200">
        <template #default="scope">
          <el-button
            v-if="scope.row.formType === 10"
            link
            type="primary"
            @click="handleFormDetail(scope.row)"
          >
            <span>{{ scope.row.formName }}</span>
          </el-button>
          <el-button v-else link type="primary" @click="handleFormDetail(scope.row)">
            <span>{{ scope.row.formCustomCreatePath }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="流程版本" prop="processDefinition.version" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row">v{{ scope.row.version }}</el-tag>
          <el-tag v-else type="warning">未部署</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" prop="version" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.suspensionState === 1" type="success">激活</el-tag>
          <el-tag v-if="scope.row.suspensionState === 2" type="warning">挂起</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="部署时间"
        prop="deploymentTime"
        width="180"
      />
      <el-table-column
        align="center"
        label="定义描述"
        prop="description"
        show-overflow-tooltip
        width="300"
      />
      <el-table-column align="center" fixed="right" label="操作" width="150">
        <template #default="scope">
          <el-button
            v-hasPermi="['bpm:task-assign-rule:query']"
            link
            type="primary"
            @click="handleAssignRule(scope.row)"
          >
            分配规则
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 弹窗：表单详情 -->
  <Dialog v-model="formDetailVisible" title="表单详情" width="800">
    <my-form-create :option="formDetailPreview.option" :rule="formDetailPreview.rule" />
  </Dialog>

  <!-- 弹窗：流程模型图的预览 -->
  <Dialog v-model="bpmnDetailVisible" title="流程图" width="800">
    <MyProcessViewer
      key="designer"
      v-model="bpmnXML"
      :prefix="bpmnControlForm.prefix"
      :value="bpmnXML as any"
      v-bind="bpmnControlForm"
    />
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'
import * as DefinitionApi from '@/api/bpm/definition'
import { setConfAndFields2 } from '@/utils/formCreate'

defineOptions({ name: 'BpmProcessDefinition' })

const { push } = useRouter() // 路由
const { query } = useRoute() // 查询参数

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  key: query.key
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DefinitionApi.getProcessDefinitionPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 点击任务分配按钮 */
const handleAssignRule = (row) => {
  push({
    name: 'BpmTaskAssignRuleList',
    query: {
      modelId: row.id
    }
  })
}

/** 流程表单的详情按钮操作 */
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
    await push({
      path: row.formCustomCreatePath
    })
  }
}

/** 流程图的详情按钮操作 */
const bpmnDetailVisible = ref(false)
const bpmnXML = ref(null)
const bpmnControlForm = ref({
  prefix: 'flowable'
})
const handleBpmnDetail = async (row) => {
  bpmnXML.value = await DefinitionApi.getProcessDefinitionBpmnXML(row.id)
  bpmnDetailVisible.value = true
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
