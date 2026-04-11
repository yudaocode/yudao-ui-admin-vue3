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
      <el-form-item label="文档编号" prop="documentId">
        <el-input
          v-model="queryParams.documentId"
          placeholder="请输入文档编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否启用" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择是否启用"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
          v-hasPermi="['ai:knowledge:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="分段编号" align="center" prop="id" />
      <el-table-column type="expand">
        <template #default="props">
          <div
            class="content-expand"
            style="
              padding: 10px 20px;
              white-space: pre-wrap;
              line-height: 1.5;
              background-color: #f9f9f9;
              border-radius: 4px;
              border-left: 3px solid #409eff;
            "
          >
            <div
              class="content-title"
              style="margin-bottom: 8px; color: #606266; font-size: 14px; font-weight: bold"
            >
              完整内容：
            </div>
            {{ props.row.content }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="切片内容"
        align="center"
        prop="content"
        min-width="250px"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="字符数" align="center" prop="contentLength" />
      <el-table-column label="token 数量" align="center" prop="tokens" />
      <el-table-column label="召回次数" align="center" prop="retrievalCount" />
      <el-table-column label="是否启用" align="center" prop="status">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
            :disabled="!checkPermi(['ai:knowledge:update'])"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['ai:knowledge:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai:knowledge:delete']"
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

  <!-- 表单弹窗：添加/修改 -->
  <KnowledgeSegmentForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { KnowledgeSegmentApi, KnowledgeSegmentVO } from '@/api/ai/knowledge/segment'
import KnowledgeSegmentForm from './KnowledgeSegmentForm.vue'
import { CommonStatusEnum } from '@/utils/constants'
import { checkPermi } from '@/utils/permission'

/** AI 知识库分段 列表 */
defineOptions({ name: 'KnowledgeSegment' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const route = useRoute() // 路由
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<KnowledgeSegmentVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  documentId: undefined,
  content: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await KnowledgeSegmentApi.getKnowledgeSegmentPage(queryParams)
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
  formRef.value.open(type, id, queryParams.documentId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await KnowledgeSegmentApi.deleteKnowledgeSegment(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 修改状态操作 */
const handleStatusChange = async (row: KnowledgeSegmentVO) => {
  try {
    // 修改状态的二次确认
    const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '禁用'
    await message.confirm('确认要"' + text + '"该分段吗?')
    // 发起修改状态
    await KnowledgeSegmentApi.updateKnowledgeSegmentStatus({ id: row.id, status: row.status })
    message.success(t('common.updateSuccess'))
    // 刷新列表
    await getList()
  } catch {
    // 取消后，进行恢复按钮
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 初始化 **/
onMounted(() => {
  // 如果文档 ID 不存在，显示错误提示并关闭页面
  if (!route.query.documentId) {
    message.error('文档 ID 不存在，无法查看分段列表')
    // 关闭当前路由，返回到文档列表页面
    router.push({ name: 'AiKnowledgeDocument' })
    return
  }

  // 从路由参数中获取文档 ID
  queryParams.documentId = route.query.documentId as any
  getList()
})
</script>
