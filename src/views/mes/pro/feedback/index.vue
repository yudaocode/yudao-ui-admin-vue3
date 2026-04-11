<!-- MES 生产报工列表 -->
<template>
  <doc-alert title="【生产】生产报工" url="https://doc.iocoder.cn/mes/feedback/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="报工单号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入报工单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报工类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择报工类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="生产工单" prop="workOrderId">
        <ProWorkOrderSelect
          v-model="queryParams.workOrderId"
          placeholder="请选择工单"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品物料" prop="itemId">
        <MdItemSelect v-model="queryParams.itemId" placeholder="请选择产品物料" class="!w-240px" />
      </el-form-item>
      <el-form-item label="报工人" prop="feedbackUserId">
        <UserSelectV2
          v-model="queryParams.feedbackUserId"
          placeholder="请选择报工人"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="记录人" prop="creator">
        <UserSelectV2 v-model="queryParams.creator" placeholder="请选择记录人" class="!w-240px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="报工时间" prop="feedbackTime">
        <el-date-picker
          v-model="queryParams.feedbackTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:pro-feedback:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-feedback:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
    >
      <el-table-column label="报工单号" align="center" prop="code" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="报工类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="工作站" align="center" prop="workstationName" width="120" />
      <el-table-column label="工序" align="center" prop="processName" width="100" />
      <el-table-column label="生产工单编码" align="center" prop="workOrderCode" width="160" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" width="120" />
      <el-table-column label="规格型号" align="center" prop="itemSpecification" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="报工数量" align="center" prop="feedbackQuantity" width="100" />
      <el-table-column label="报工人" align="center" prop="feedbackUserNickname" width="100" />
      <el-table-column
        label="报工时间"
        align="center"
        prop="feedbackTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="审核人" align="center" prop="approveUserNickname" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿状态：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:pro-feedback:update']"
            v-if="scope.row.status === MesProFeedbackStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="openForm('submit', scope.row.id)"
            v-hasPermi="['mes:pro-feedback:update']"
            v-if="scope.row.status === MesProFeedbackStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:pro-feedback:delete']"
            v-if="scope.row.status === MesProFeedbackStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 审批中状态：审批（仅限审核人本人） -->
          <el-button
            link
            type="primary"
            @click="openForm('approve', scope.row.id)"
            v-hasPermi="['mes:pro-feedback:approve']"
            v-if="
              scope.row.status === MesProFeedbackStatusEnum.APPROVING &&
              scope.row.approveUserId === currentUserId
            "
          >
            审批
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

  <!-- 表单弹窗：添加/修改/提交/审批/详情 -->
  <FeedbackForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { ProFeedbackApi, ProFeedbackVO } from '@/api/mes/pro/feedback'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import FeedbackForm from './FeedbackForm.vue'
import { MesProFeedbackStatusEnum } from '@/views/mes/utils/constants'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'MesProFeedback' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const currentUserId = useUserStore().getUser.id // 当前登录用户 ID

const loading = ref(true) // 列表的加载中
const list = ref<ProFeedbackVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  type: undefined,
  workOrderId: undefined,
  itemId: undefined,
  feedbackUserId: undefined,
  creator: undefined,
  status: undefined,
  feedbackTime: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProFeedbackApi.getFeedbackPage(queryParams)
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

/** 添加/修改/提交/审批/详情操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProFeedbackApi.deleteFeedback(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProFeedbackApi.exportFeedback(queryParams)
    download.excel(data, '生产报工.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
