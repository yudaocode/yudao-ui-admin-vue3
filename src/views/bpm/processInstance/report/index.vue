<template>
  <doc-alert title="工作流手册" url="https://doc.iocoder.cn/bpm/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="发起人" prop="startUserId">
        <el-select v-model="queryParams.startUserId" placeholder="请选择发起人" class="!w-240px">
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
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
      <el-form-item label="流程状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择流程状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发起时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item
        v-for="(item, index) in formFields"
        :key="index"
        :label="item.title"
        :prop="item.field"
      >
        <!-- 模糊匹配：输入框（包括多行输入框） -->
        <el-tooltip
          v-if="item.queryOp === 'like'"
          content="模糊匹配：% 匹配任意多个字符，_ 匹配任意一个字符"
          placement="top"
        >
          <el-input
            v-model="queryParams.formFieldsParams[item.field].value"
            :placeholder="`请输入${item.title}`"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-tooltip>
        <!-- 数字范围：计数器 -->
        <div v-else-if="item.queryOp === 'numberRange'" class="flex items-center !w-240px">
          <el-input-number
            v-model="queryParams.formFieldsParams[item.field].value[0]"
            :controls="false"
            placeholder="最小值"
            class="!w-110px"
          />
          <span class="mx-5px">-</span>
          <el-input-number
            v-model="queryParams.formFieldsParams[item.field].value[1]"
            :controls="false"
            placeholder="最大值"
            class="!w-110px"
          />
        </div>
        <!-- 日期区间：日期、日期时间 -->
        <el-date-picker
          v-else-if="item.queryOp === 'dateRange'"
          v-model="queryParams.formFieldsParams[item.field].value"
          value-format="YYYY-MM-DD"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
        <el-input v-else disabled :placeholder="`暂不支持搜索（${item.type}）`" class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" border :data="list">
      <el-table-column label="流程名称" align="center" prop="name" fixed="left" width="200" />
      <el-table-column label="流程发起人" align="center" prop="startUser.nickname" width="120" />
      <el-table-column label="流程状态" prop="status" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="发起时间"
        align="center"
        prop="startTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        v-for="(item, index) in formFields"
        :key="index"
        :label="item.title"
        :prop="item.field"
        width="120"
      >
        <!-- TODO @lesan：可以根据formField的type进行展示方式的控制，现在全部以字符串 -->
        <template #default="scope">
          {{ scope.row.formVariables[item.field] ?? '' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            v-hasPermi="['bpm:process-instance:query']"
            @click="handleDetail(scope.row)"
          >
            详情
          </el-button>
          <el-button
            link
            type="primary"
            v-if="scope.row.status === 1"
            v-hasPermi="['bpm:process-instance:cancel']"
            @click="handleCancel(scope.row)"
          >
            取消
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
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as UserApi from '@/api/system/user'
import * as DefinitionApi from '@/api/bpm/definition'
import { collectFieldRules, parseFormFields } from '@/components/FormCreate/src/utils'
import { ElMessageBox } from 'element-plus'

defineOptions({ name: 'BpmProcessInstanceReport' })

const router = useRouter() // 路由
const { query } = useRoute()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const formFields = ref()
const processDefinitionId = query.processDefinitionId as string
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  startUserId: undefined,
  name: '',
  processDefinitionKey: query.processDefinitionKey,
  status: undefined,
  createTime: [],
  endTime: [],
  formFieldsParams: {} as Record<string, any> // 表单字段的查询条件，见 initFormFieldsParams 方法
})
const queryFormRef = ref() // 搜索的表单
const userList = ref<any[]>([]) // 用户列表
let listRequestId = 0 // 列表请求的序号，避免较早的请求较晚返回时，覆盖较新的结果

/** 查询列表 */
const getList = async () => {
  const requestId = ++listRequestId
  loading.value = true
  try {
    const data = await ProcessInstanceApi.getProcessInstanceManagerPage({
      ...queryParams,
      formFieldsParams: JSON.stringify(queryParams.formFieldsParams)
    })
    if (requestId !== listRequestId) {
      return
    }
    list.value = data.list
    total.value = data.total
  } finally {
    if (requestId === listRequestId) {
      loading.value = false
    }
  }
}

/** 获取流程定义 */
const getProcessDefinition = async () => {
  const processDefinition = await DefinitionApi.getProcessDefinition(processDefinitionId)
  formFields.value = parseFormCreateFields(processDefinition.formFields)
  initFormFieldsParams()
}

/** 解析表单字段，并设置每个字段的查询方式（queryOp） */
const parseFormCreateFields = (formFields?: string[]) => {
  const result: Array<Record<string, any>> = []
  if (formFields) {
    const rules = formFields.map((fieldStr: string) => JSON.parse(fieldStr))
    rules.forEach((rule) => parseFormFields(rule, result))
    const ruleMap = new Map<string, Record<string, any>>(
      collectFieldRules(rules).map((rule) => [rule.field, rule])
    )
    result.forEach((item) => {
      const rule = ruleMap.get(item.field)
      item.queryOp = rule ? getFormFieldQueryOp(rule) : undefined
    })
  }
  return result
}

/**
 * 获得表单字段的查询方式，与后端 formFieldsParams 的 op 一致；返回 undefined 时，表示暂不支持
 *
 * 1. 输入框（多行输入框的 type 也是 input）：模糊匹配
 * 2. 计数器：数字范围
 * 3. 日期（date、datetime 类型），并且是默认的值格式：日期区间。值按 YYYY-MM-DD、YYYY-MM-DD HH:mm:ss 字符串比较
 */
const getFormFieldQueryOp = (rule: Record<string, any>) => {
  if (rule.type === 'input') {
    return 'like'
  }
  if (rule.type === 'inputNumber') {
    return 'numberRange'
  }
  const { type = 'date', valueFormat } = rule.props || {}
  if (
    rule.type === 'datePicker' &&
    ['date', 'datetime'].includes(type) &&
    (!valueFormat || ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'].includes(valueFormat))
  ) {
    return 'dateRange'
  }
  return undefined
}

/** 初始化表单字段的查询条件：{ op, value }，其中范围的 value 为 [开始, 结束]，为空时不筛选 */
const initFormFieldsParams = () => {
  const params: Record<string, any> = {}
  formFields.value?.forEach((item: Record<string, any>) => {
    if (item.queryOp) {
      params[item.field] = {
        op: item.queryOp,
        value: item.queryOp === 'numberRange' ? [undefined, undefined] : undefined
      }
    }
  })
  queryParams.formFieldsParams = params
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  initFormFieldsParams()
  handleQuery()
}

/** 查看详情 */
const handleDetail = (row) => {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.id
    }
  })
}

/** 取消按钮操作 */
const handleCancel = async (row) => {
  // 二次确认
  const { value } = await ElMessageBox.prompt('请输入取消原因', '取消流程', {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    inputPattern: /^[\s\S]*.*\S[\s\S]*$/, // 判断非空，且非空格
    inputErrorMessage: '取消原因不能为空'
  })
  // 发起取消
  await ProcessInstanceApi.cancelProcessInstanceByAdmin(row.id, value)
  message.success('取消成功')
  // 刷新列表
  await getList()
}

/** 初始化 **/
onMounted(async () => {
  // 获取流程定义，用于 table column 的展示
  await getProcessDefinition()
  // 获取流程列表
  await getList()
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>
