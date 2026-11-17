<!-- AI 短剧制作管理：生成任务（出图、镜头视频、成片合成） -->
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
      <el-form-item label="任务类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="全部类型" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_TASK_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户" prop="userId">
        <UserSelect v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="项目编号" prop="projectId">
        <el-input
          v-model="queryParams.projectId"
          placeholder="请输入项目编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="模型" prop="modelId">
        <ModelSelect
          v-model="queryParams.modelId"
          clearable
          class="!w-240px"
          @loaded="(data) => (models = data)"
        />
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTime">
        <el-date-picker
          v-model="queryParams.updateTime"
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
      </el-form-item>
    </el-form>
    <div class="mt-15px text-12px text-[var(--el-text-color-secondary)]">
      按模型筛选时，不含成片合成（合成不使用模型）
    </div>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="类型" align="center" prop="type" width="100" fixed="left">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_TASK_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="编号" align="center" prop="id" width="90" />
      <el-table-column label="项目" min-width="150">
        <template #default="{ row }">{{ row.projectName || '-' }}（{{ row.projectId }}）</template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="userNickname" min-width="110" />
      <el-table-column label="名称" prop="title" min-width="140" />
      <el-table-column label="状态" align="center" prop="status" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_STATUS" :value="row.status" />
          <el-tag v-if="row.timeout" type="danger" size="small" class="ml-4px">超时</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" min-width="140">
        <template #default="{ row }">{{ getModelName(row.modelId) }}</template>
      </el-table-column>
      <el-table-column label="提示词" prop="prompt" min-width="200" />
      <el-table-column label="服务商任务" prop="taskId" min-width="160" />
      <el-table-column label="结果" align="center" width="90" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-link v-if="row.resultUrl" type="primary" :href="row.resultUrl" target="_blank">
            查看
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="errorMessage" min-width="200">
        <template #default="{ row }">
          <span v-if="row.status === AiDramaStatusEnum.FAIL" class="text-[var(--el-color-danger)]">
            {{ row.errorMessage || '-' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="checkPermi(['ai:drama:task'])">
            <el-button
              v-if="row.status === AiDramaStatusEnum.FAIL"
              link
              type="primary"
              @click="handleAction('resubmit', row)"
            >
              重新提交
            </el-button>
            <el-button
              v-if="row.type === STORYBOARD_TASK_TYPE && isSyncable(row.status)"
              link
              type="primary"
              @click="handleAction('sync', row)"
            >
              同步状态
            </el-button>
            <el-button
              v-if="isAiDramaRunning(row.status)"
              link
              type="danger"
              @click="handleAction('updateFail', row)"
            >
              标记失败
            </el-button>
          </template>
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

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import { DramaTaskApi, DramaTaskVO } from '@/api/ai/drama/task'
import { ModelVO } from '@/api/ai/model/model'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import { AiDramaStatusEnum, isAiDramaRunning } from '@/views/ai/utils/constants'

/** AI 短剧制作管理：生成任务 */
defineOptions({ name: 'AiDramaTaskList' })

const STORYBOARD_TASK_TYPE = 4 // 镜头视频：唯一支持同步的任务类型
const COMPOSE_TASK_TYPE = 5 // 成片合成：重新提交不保留原合成的参数

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<DramaTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined,
  status: undefined,
  userId: undefined,
  projectId: undefined,
  modelId: undefined,
  updateTime: []
})
const queryFormRef = ref() // 搜索的表单
const models = ref<ModelVO[]>([]) // 模型列表，由 ModelSelect 加载，用于展示模型名

const getModelName = (modelId?: number) => {
  if (!modelId) {
    return '-'
  }
  return models.value.find((item) => item.id === modelId)?.name || modelId
}

/** 转存中、生成中的镜头视频可同步 */
const isSyncable = (status: number) =>
  status === AiDramaStatusEnum.IN_PROGRESS || status === AiDramaStatusEnum.SAVING

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DramaTaskApi.getTaskPage(queryParams)
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

/** 任务操作：重新提交、同步状态、标记失败 */
const ACTIONS = {
  resubmit: { text: '重新提交', api: DramaTaskApi.resubmitTask },
  sync: { text: '同步状态', api: DramaTaskApi.syncTask },
  updateFail: { text: '标记失败', api: DramaTaskApi.updateTaskFail }
}
const handleAction = async (action: keyof typeof ACTIONS, row: DramaTaskVO) => {
  const { text, api } = ACTIONS[action]
  // 成片合成没有保存原来的镜头选择、画幅、旁白、水印：明确告知按什么重新合成
  const tip =
    action === 'resubmit' && row.type === COMPOSE_TASK_TYPE
      ? '将使用全部已完成的镜头、项目画幅与转场重新合成，不含旁白和水印，可能与原合成不同。'
      : ''
  try {
    await message.confirm(`${tip}确认要"${text}"该任务吗?`)
  } catch {
    return
  }
  await api(row.type, row.id)
  message.success(`${text}成功`)
  await getList()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
