<template>
  <doc-alert
    title="【行政】办公用品、用印管理"
    url="https://doc.iocoder.cn/oa/administration/supply-seal/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="80px"
      class="-mb-15px"
    >
      <el-form-item label="单据编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入单据编号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option label="未提交" :value="-1" />
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="申请部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" placeholder="请选择申请部门" class="!w-240px" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:supply-apply:create']"
          type="primary"
          plain
          @click="formRef.open('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" min-width="210">
        <template #default="{ row }">
          <el-button link type="primary" @click="detailRef.open(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status === BpmProcessInstanceStatus.NOT_START" type="info">
            未提交
          </el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="申请事由" prop="reason" min-width="200" show-overflow-tooltip />
      <el-table-column label="申请人" prop="creatorName" min-width="100" />
      <el-table-column label="申请部门" prop="deptName" min-width="120" />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" fixed="right" width="175">
        <template #default="{ row }">
          <template v-if="[-1, 3, 4].includes(row.status)">
            <el-button
              v-hasPermi="['oa:supply-apply:update']"
              link
              type="primary"
              @click="formRef.open('update', row.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['oa:supply-apply:create']"
              link
              type="primary"
              @click="handleSubmit(row.id)"
            >
              提交
            </el-button>
            <el-button
              v-hasPermi="['oa:supply-apply:delete']"
              link
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
          <el-button
            v-if="row.processInstanceId"
            link
            type="primary"
            @click="handleProcessDetail(row.processInstanceId)"
          >
            进度
          </el-button>
          <el-button
            v-if="row.status === BpmProcessInstanceStatus.RUNNING"
            v-hasPermi="['oa:supply-apply:update']"
            link
            type="danger"
            @click="handleCancel(row.id)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 表单与详情 -->
  <OaSupplyApplyForm ref="formRef" @success="getList" />
  <OaSupplyApplyDetail ref="detailRef" />
</template>

<script setup lang="ts">
import * as SupplyApplyApi from '@/api/oa/supply/apply'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { dateFormatter } from '@/utils/formatTime'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import OaSupplyApplyForm from './OaSupplyApplyForm.vue'
import OaSupplyApplyDetail from './OaSupplyApplyDetail.vue'

defineOptions({ name: 'OaSupplyApply' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const loading = ref(true) // 列表加载中
const list = ref<SupplyApplyApi.SupplyApplyVO[]>([]) // 列表数据
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined,
  status: undefined,
  deptId: undefined,
  createTime: []
}) // 查询条件
const queryFormRef = ref() // 搜索表单
const formRef = ref() // 申请表单
const detailRef = ref() // 详情弹窗

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await SupplyApplyApi.getSupplyApplyPage(queryParams)
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

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    await message.delConfirm()
    await SupplyApplyApi.deleteSupplyApply(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 提交按钮操作 */
async function handleSubmit(id: number) {
  try {
    await message.confirm('确定提交该领用申请吗？')
    await SupplyApplyApi.submitSupplyApply(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 取消按钮操作 */
async function handleCancel(id: number) {
  try {
    await message.confirm('确定取消该领用申请吗？')
    await SupplyApplyApi.cancelSupplyApply(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 查看审批进度 */
function handleProcessDetail(id: string) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id }
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
