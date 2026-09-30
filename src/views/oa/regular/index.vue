<template>
  <doc-alert
    title="【流程】考勤、请假、加班、转正与离职"
    url="https://doc.iocoder.cn/oa/attendance-application/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="68px"
      class="-mb-15px"
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="审批状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择审批状态"
          clearable
          class="!w-240px"
        >
          <el-option label="未提交" :value="BpmProcessInstanceStatus.NOT_START" />
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS).filter(
              (item) => item.value !== BpmProcessInstanceStatus.NOT_START
            )"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:regular-apply:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 本人申请列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="标题" min-width="240">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.title }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" width="110">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_APPLY_URGENCY" :value="row.urgency" />
        </template>
      </el-table-column>
      <el-table-column label="申请人" prop="creatorName" width="120" />
      <el-table-column label="申请时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="审批状态" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.status === BpmProcessInstanceStatus.NOT_START" type="info">
            未提交
          </el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === BpmProcessInstanceStatus.NOT_START"
            v-hasPermi="['oa:regular-apply:create']"
            link
            type="primary"
            @click="handleSubmit(row.id)"
          >
            提交
          </el-button>
          <el-button
            v-if="row.status === BpmProcessInstanceStatus.NOT_START"
            v-hasPermi="['oa:regular-apply:create']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-if="row.processInstanceId"
            link
            type="primary"
            @click="handleProcessDetail(row.processInstanceId)"
          >
            审批进度
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 添加或修改转正申请弹窗 -->
  <OaRegularApplyForm ref="formRef" @success="getList" />
  <!-- 转正申请详情弹窗 -->
  <OaRegularApplyDetail ref="detailRef" />
</template>

<script setup lang="ts">
import * as RegularApplyApi from '@/api/oa/regular'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import OaRegularApplyForm from './OaRegularApplyForm.vue'
import OaRegularApplyDetail from './OaRegularApplyDetail.vue'

defineOptions({ name: 'OaRegularApply' })

const router = useRouter() // 路由
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<RegularApplyApi.RegularApplyVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 添加、修改表单 Ref
const detailRef = ref() // 详情 Ref

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await RegularApplyApi.getRegularApplyPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 查看详情操作 */
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 查看审批进度 */
function handleProcessDetail(id: string) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id
    }
  })
}

/** 提交审批 */
async function handleSubmit(id: number) {
  try {
    // 提交二次确认
    await message.confirm('确认提交申请？')
    // 发起审批
    await RegularApplyApi.submitRegularApply(id, {})
    message.success('提交成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
