<template>
  <doc-alert title="流程设计器（BPMN）" url="https://doc.iocoder.cn/bpm/model-designer-dingding/" />
  <doc-alert
    title="流程设计器（钉钉、飞书）"
    url="https://doc.iocoder.cn/bpm/model-designer-bpmn/"
  />
  <doc-alert title="选择审批人、发起人自选" url="https://doc.iocoder.cn/bpm/assignee/" />
  <doc-alert title="会签、或签、依次审批" url="https://doc.iocoder.cn/bpm/multi-instance/" />

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
            v-for="category in categoryList"
            :key="category.code"
            :label="category.name"
            :value="category.code"
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
          <Icon icon="ep:plus" class="mr-5px" /> 新建
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="流程名称" align="center" prop="name" min-width="200" />
      <el-table-column label="流程图标" align="center" prop="icon" min-width="100">
        <template #default="scope">
          <el-image :src="scope.row.icon" class="h-32px w-32px" />
        </template>
      </el-table-column>
      <el-table-column label="可见范围" align="center" prop="startUserIds" min-width="100">
        <template #default="scope">
          <el-text v-if="!scope.row.startUsers || scope.row.startUsers.length === 0">
            全部可见
          </el-text>
          <el-text v-else-if="scope.row.startUsers.length == 1">
            {{ scope.row.startUsers[0].nickname }}
          </el-text>
          <el-text v-else>
            <el-tooltip
              class="box-item"
              effect="dark"
              placement="top"
              :content="scope.row.startUsers.map((user: any) => user.nickname).join('、')"
            >
              {{ scope.row.startUsers[0].nickname }}等 {{ scope.row.startUsers.length }} 人可见
            </el-tooltip>
          </el-text>
        </template>
      </el-table-column>
      <el-table-column label="流程分类" align="center" prop="categoryName" min-width="100" />
      <el-table-column label="表单信息" align="center" prop="formType" min-width="200">
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
      <el-table-column label="最后发布" align="center" prop="deploymentTime" min-width="250">
        <template #default="scope">
          <span v-if="scope.row.processDefinition">
            {{ formatDate(scope.row.processDefinition.deploymentTime) }}
          </span>
          <el-tag v-if="scope.row.processDefinition" class="ml-10px">
            v{{ scope.row.processDefinition.version }}
          </el-tag>
          <el-tag v-else type="warning">未部署</el-tag>
          <el-tag
            v-if="scope.row.processDefinition?.suspensionState === 2"
            type="warning"
            class="ml-10px"
          >
            已停用
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['bpm:model:update']"
            :disabled="!isManagerUser(scope.row)"
          >
            修改
          </el-button>
          <el-button
            link
            class="!ml-5px"
            type="primary"
            @click="handleDesign(scope.row)"
            v-hasPermi="['bpm:model:update']"
            :disabled="!isManagerUser(scope.row)"
          >
            设计
          </el-button>
          <el-button
            link
            class="!ml-5px"
            type="primary"
            @click="handleDeploy(scope.row)"
            v-hasPermi="['bpm:model:deploy']"
            :disabled="!isManagerUser(scope.row)"
          >
            发布
          </el-button>
          <el-dropdown
            class="!align-middle ml-5px"
            @command="(command) => handleCommand(command, scope.row)"
            v-hasPermi="['bpm:process-definition:query', 'bpm:model:update', 'bpm:model:delete']"
          >
            <el-button type="primary" link>更多</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="handleDefinitionList"
                  v-if="checkPermi(['bpm:process-definition:query'])"
                >
                  历史
                </el-dropdown-item>
                <el-dropdown-item
                  command="handleChangeState"
                  v-if="checkPermi(['bpm:model:update']) && scope.row.processDefinition"
                  :disabled="!isManagerUser(scope.row)"
                >
                  {{ scope.row.processDefinition.suspensionState === 1 ? '停用' : '启用' }}
                </el-dropdown-item>
                <el-dropdown-item
                  type="danger"
                  command="handleDelete"
                  v-if="checkPermi(['bpm:model:delete'])"
                  :disabled="!isManagerUser(scope.row)"
                >
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

  <!-- 弹窗：表单详情 -->
  <Dialog title="表单详情" v-model="formDetailVisible" width="800">
    <form-create :rule="formDetailPreview.rule" :option="formDetailPreview.option" />
  </Dialog>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import ModelForm from './ModelForm.vue'
import { setConfAndFields2 } from '@/utils/formCreate'
import { CategoryApi } from '@/api/bpm/category'
import { BpmModelType } from '@/utils/constants'
import { checkPermi } from '@/utils/permission'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'BpmModel' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由
const userStore = useUserStoreWithOut() // 用户信息缓存

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
const categoryList = ref([]) // 流程分类列表

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

/** '更多'操作按钮 */
const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'handleDefinitionList':
      handleDefinitionList(row)
      break
    case 'handleDelete':
      handleDelete(row)
      break
    case 'handleChangeState':
      handleChangeState(row)
      break
    default:
      break
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (row: any) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ModelApi.deleteModel(row.id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 更新状态操作 */
const handleChangeState = async (row: any) => {
  const state = row.processDefinition.suspensionState
  const newState = state === 1 ? 2 : 1
  try {
    // 修改状态的二次确认
    const id = row.id
    debugger
    const statusState = state === 1 ? '停用' : '启用'
    const content = '是否确认' + statusState + '流程名字为"' + row.name + '"的数据项?'
    await message.confirm(content)
    // 发起修改状态
    await ModelApi.updateModelState(id, newState)
    message.success(statusState + '成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 设计流程 */
const handleDesign = (row: any) => {
  if (row.type == BpmModelType.BPMN) {
    push({
      name: 'BpmModelEditor',
      query: {
        modelId: row.id
      }
    })
  } else {
    push({
      name: 'SimpleWorkflowDesignEditor',
      query: {
        modelId: row.id
      }
    })
  }
}

/** 发布流程 */
const handleDeploy = async (row: any) => {
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
const handleFormDetail = async (row: any) => {
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

/** 判断是否可以操作 */
const isManagerUser = (row: any) => {
  const userId = userStore.getUser.id
  return row.managerUserIds && row.managerUserIds.includes(userId)
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 查询流程分类列表
  categoryList.value = await CategoryApi.getCategorySimpleList()
})
</script>
