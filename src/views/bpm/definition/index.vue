<template>
  <doc-alert title="工作流手册" url="https://doc.iocoder.cn/bpm/" />

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="定义编号" align="center" prop="id" width="400" />
      <el-table-column label="流程名称" align="center" prop="name" width="200">
        <template #default="scope">
          <el-button type="primary" link @click="handleBpmnDetail(scope.row)">
            <span>{{ scope.row.name }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="定义分类" align="center" prop="categoryName" width="100" />
      <el-table-column label="表单信息" align="center" prop="formType" width="200">
        <template #default="scope">
          <el-button
            v-if="scope.row.formType === 10"
            type="primary"
            link
            @click="handleFormDetail(scope.row)"
          >
            <span>{{ scope.row.formName }}</span>
          </el-button>
          <el-button v-else type="primary" link @click="handleFormDetail(scope.row)">
            <span>{{ scope.row.formCustomCreatePath }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="流程版本" align="center" prop="processDefinition.version" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row">v{{ scope.row.version }}</el-tag>
          <el-tag type="warning" v-else>未部署</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="version" width="80">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.suspensionState === 1">激活</el-tag>
          <el-tag type="warning" v-if="scope.row.suspensionState === 2">挂起</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="部署时间"
        align="center"
        prop="deploymentTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="定义描述"
        align="center"
        prop="description"
        width="300"
        show-overflow-tooltip
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 弹窗：表单详情 -->
  <Dialog title="表单详情" v-model="formDetailVisible" width="800">
    <form-create :rule="formDetailPreview.rule" :option="formDetailPreview.option" />
  </Dialog>

  <!-- 弹窗：流程模型图的预览 -->
  <Dialog title="流程图" v-model="bpmnDetailVisible" width="800">
    <MyProcessViewer
      key="designer"
      v-model="bpmnXml"
      :value="bpmnXml as any"
      v-bind="bpmnControlForm"
      :prefix="bpmnControlForm.prefix"
    />
  </Dialog>
</template>

<script lang="ts" setup>
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
const bpmnXml = ref(null)
const bpmnControlForm = ref({
  prefix: 'flowable'
})
const handleBpmnDetail = async (row) => {
  bpmnXml.value = (await DefinitionApi.getProcessDefinition(row.id))?.bpmnXml
  bpmnDetailVisible.value = true
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
