<template>
  <doc-alert title="AI 视频生成" url="https://doc.iocoder.cn/ai/video/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="用户" prop="userId">
        <UserSelect v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="创作类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择创作类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_VIDEO_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select
          v-model="queryParams.platform"
          placeholder="请选择平台"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.AI_PLATFORM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_VIDEO_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否公开" prop="publicStatus">
        <el-select
          v-model="queryParams.publicStatus"
          placeholder="请选择是否公开"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="提示词" prop="prompt">
        <el-input
          v-model="queryParams.prompt"
          placeholder="请输入提示词"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="90" fixed="left" />
      <el-table-column label="视频" align="center" width="140" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-link
            v-if="row.status === AiVideoStatusEnum.SUCCESS && row.videoUrl"
            type="primary"
            :href="row.videoUrl"
            target="_blank"
          >
            <Icon icon="ep:video-play" class="mr-4px" /> 播放
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="创作类型" align="center" prop="type" width="110">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform" width="110">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="row.platform" />
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="model" min-width="160" />
      <el-table-column label="提示词" prop="prompt" min-width="200" />
      <el-table-column label="时长" align="center" prop="duration" width="80">
        <template #default="{ row }">{{ row.duration ? row.duration + ' 秒' : '-' }}</template>
      </el-table-column>
      <el-table-column label="是否公开" align="center" prop="publicStatus" width="90">
        <template #default="{ row }">
          <el-switch
            v-model="row.publicStatus"
            :active-value="true"
            :inactive-value="false"
            :disabled="row.status !== AiVideoStatusEnum.SUCCESS || !checkPermi(['ai:video:update'])"
            @change="handleUpdatePublicStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="errorMessage" min-width="200">
        <template #default="{ row }">
          <span v-if="row.status === AiVideoStatusEnum.FAIL" class="text-[var(--el-color-danger)]">
            {{ row.errorMessage || '-' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openDetail(row.id)"
            v-hasPermi="['ai:video:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="isAiVideoRunning(row.status)"
            @click="handleDelete(row.id)"
            v-hasPermi="['ai:video:delete']"
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

  <!-- 详情 -->
  <VideoDetailDialog ref="detailRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import { VideoApi, VideoVO } from '@/api/ai/video'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { AiVideoStatusEnum, isAiVideoRunning } from '@/views/ai/utils/constants'
import VideoDetailDialog from '../components/VideoDetailDialog.vue'

/** AI 视频生成管理 */
defineOptions({ name: 'AiVideoManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<VideoVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  type: undefined,
  platform: undefined,
  status: undefined,
  publicStatus: undefined,
  prompt: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await VideoApi.getVideoPage(queryParams)
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

/** 详情 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value?.open(id, 'admin')
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await VideoApi.deleteVideo(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 修改是否公开 */
const handleUpdatePublicStatusChange = async (row: VideoVO) => {
  try {
    // 修改状态的二次确认
    const text = row.publicStatus ? '公开' : '取消公开'
    await message.confirm('确认要"' + text + '"该视频吗?')
    // 发起修改状态
    await VideoApi.updateVideo({ id: row.id, publicStatus: row.publicStatus })
    message.success(t('common.updateSuccess'))
  } catch {
    row.publicStatus = !row.publicStatus
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
