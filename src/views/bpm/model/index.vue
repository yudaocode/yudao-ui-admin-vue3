<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="流程标识" prop="key">
        <el-input
          v-model="queryParams.key"
          placeholder="请输入流程标识"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="流程名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入流程名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="流程分类" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择流程分类"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_CATEGORY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['bpm:model:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新建流程
        </el-button>
        <el-button type="success" plain @click="openImportForm" v-hasPermi="['bpm:model:import']">
          <Icon icon="ep:upload" class="mr-5px" /> 导入流程
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="流程标识" align="center" prop="key" width="200" />
      <el-table-column label="流程名称" align="center" prop="name" width="200">
        <template #default="scope">
          <el-button type="primary" link @click="handleBpmnDetail(scope.row)">
            <span>{{ scope.row.name }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="流程分类" align="center" prop="category" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_MODEL_CATEGORY" :value="scope.row.category" />
        </template>
      </el-table-column>
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
          <el-button
            v-else-if="scope.row.formType === 20"
            type="primary"
            link
            @click="handleFormDetail(scope.row)"
          >
            <span>{{ scope.row.formCustomCreatePath }}</span>
          </el-button>
          <label v-else>暂无表单</label>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="最新部署的流程定义" align="center">
        <el-table-column
          label="流程版本"
          align="center"
          prop="processDefinition.version"
          width="100"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.processDefinition">
              v{{ scope.row.processDefinition.version }}
            </el-tag>
            <el-tag v-else type="warning">未部署</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="激活状态"
          align="center"
          prop="processDefinition.version"
          width="85"
        >
          <template #default="scope">
            <el-switch
              v-if="scope.row.processDefinition"
              v-model="scope.row.processDefinition.suspensionState"
              :active-value="1"
              :inactive-value="2"
              @change="handleChangeState(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="部署时间" align="center" prop="deploymentTime" width="180">
          <template #default="scope">
            <span v-if="scope.row.processDefinition">
              {{ formatDate(scope.row.processDefinition.deploymentTime) }}
            </span>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['bpm:model:update']"
          >
            修改流程
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleDesign(scope.row)"
            v-hasPermi="['bpm:model:update']"
          >
            设计流程
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleAssignRule(scope.row)"
            v-hasPermi="['bpm:task-assign-rule:query']"
          >
            分配规则
          </el-button>
          <el-button
            link
            type="primary"
            @click="handleDeploy(scope.row)"
            v-hasPermi="['bpm:model:deploy']"
          >
            发布流程
          </el-button>
          <el-button
            link
            type="primary"
            v-hasPermi="['bpm:process-definition:query']"
            @click="handleDefinitionList(scope.row)"
          >
            流程定义
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['bpm:model:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改流程 -->
  <ModelForm ref="formRef" @success="getList" />

  <!-- 表单弹窗：导入流程 -->
  <ModelImportForm ref="importFormRef" @success="getList" />

  <!-- 弹窗：表单详情 -->
  <Dialog title="表单详情" v-model="formDetailVisible" width="800">
    <form-create :rule="formDetailPreview.rule" :option="formDetailPreview.option" />
  </Dialog>

  <!-- 弹窗：流程模型图的预览 -->
  <Dialog title="流程图" v-model="bpmnDetailVisible" width="800">
    <MyProcessViewer
      key="designer"
      v-model="bpmnXML"
      :value="bpmnXML as any"
      v-bind="bpmnControlForm"
      :prefix="bpmnControlForm.prefix"
    />
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import ModelForm from './ModelForm.vue'
import ModelImportForm from '@/views/bpm/model/ModelImportForm.vue'
import { setConfAndFields2 } from '@/utils/formCreate'

defineOptions({ name: 'BpmModel' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  key: undefined,
  name: undefined,
  category: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ModelApi.getModelPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 添加/修改操作 */
const importFormRef = ref()
const openImportForm = () => {
  importFormRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ModelApi.deleteModel(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 更新状态操作 */
const handleChangeState = async (row) => {
  const state = row.processDefinition.suspensionState
  try {
    // 修改状态的二次确认
    const id = row.id
    const statusState = state === 1 ? '激活' : '挂起'
    const content = '是否确认' + statusState + '流程名字为"' + row.name + '"的数据项?'
    await message.confirm(content)
    // 发起修改状态
    await ModelApi.updateModelState(id, state)
    // 刷新列表
    await getList()
  } catch {
    // 取消后，进行恢复按钮
    row.processDefinition.suspensionState = state === 1 ? 2 : 1
  }
}

/** 设计流程 */
const handleDesign = (row) => {
  push({
    name: 'BpmModelEditor',
    query: {
      modelId: row.id
    }
  })
}

/** 发布流程 */
const handleDeploy = async (row) => {
  try {
    // 删除的二次确认
    await message.confirm('是否部署该流程！！')
    // 发起部署
    await ModelApi.deployModel(row.id)
    message.success(t('部署成功'))
    // 刷新列表
    await getList()
  } catch {}
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

/** 跳转到指定流程定义列表 */
const handleDefinitionList = (row) => {
  push({
    name: 'BpmProcessDefinition',
    query: {
      key: row.key
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
    const data = await FormApi.getForm(row.formId)
    setConfAndFields2(formDetailPreview, data.conf, data.fields)
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
  const data = await ModelApi.getModel(row.id)
  bpmnXML.value = data.bpmnXml || ''
  bpmnDetailVisible.value = true
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
