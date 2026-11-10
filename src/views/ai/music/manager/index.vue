<template>
  <doc-alert title="AI 音乐创作" url="https://doc.iocoder.cn/ai/music/" />

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
        <!-- DONE @AI：是不是换成 user select 组件噢。（使用 UserSelect：与原来一样走 simple-list，只需音乐查询权限） -->
        <UserSelect v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="音乐名称" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入音乐名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="音乐状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择音乐状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_MUSIC_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="生成模式" prop="generateMode">
        <el-select
          v-model="queryParams.generateMode"
          placeholder="请选择生成模式"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_GENERATE_MODE)"
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
      <el-form-item label="关键词" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="描述或歌词"
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
      <el-table-column label="音乐" min-width="240" fixed="left" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <div class="flex items-center gap-8px">
            <div
              class="relative h-42px w-42px flex-shrink-0 overflow-hidden rounded-4px bg-[var(--el-fill-color)]"
              :class="{ 'cursor-pointer': canPlay(row) }"
              @click="handlePlay(row)"
            >
              <el-image v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="h-full w-full" />
              <div
                v-if="isAiMusicRunning(row.status)"
                class="absolute inset-0 flex items-center justify-center bg-white/70"
              >
                <Icon icon="ep:loading" class="is-loading text-[var(--el-color-primary)]" />
              </div>
              <div
                v-else-if="row.status === AiMusicStatusEnum.FAIL"
                class="absolute inset-0 flex items-center justify-center bg-white/80"
              >
                <Icon icon="ep:warning-filled" class="text-[var(--el-color-danger)]" />
              </div>
              <div
                v-else-if="canPlay(row)"
                class="absolute inset-0 flex items-center justify-center bg-black/25 text-white"
              >
                <Icon :icon="playingId === row.id ? 'ep:video-pause' : 'ep:video-play'" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate" :title="getMusicTitle(row.title)">
                {{ getMusicTitle(row.title) }}
              </div>
              <el-popover v-if="row.lyric" placement="right" :width="360" trigger="click">
                <template #reference>
                  <el-link type="primary" :underline="false" class="!text-12px"> 查看歌词 </el-link>
                </template>
                <div class="max-h-360px overflow-y-auto whitespace-pre-wrap text-13px leading-20px">
                  {{ row.lyric }}
                </div>
              </el-popover>
              <span v-else class="text-12px text-[var(--el-text-color-placeholder)]">-</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="音乐状态" align="center" prop="status" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="row.status" />
          <el-progress
            v-if="isAiMusicRunning(row.status)"
            :percentage="row.progress || 0"
            :stroke-width="5"
            :show-text="false"
            class="mt-4px"
          />
        </template>
      </el-table-column>
      <el-table-column label="生成模式" align="center" prop="generateMode" width="110">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_GENERATE_MODE" :value="row.generateMode" />
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="model" min-width="120" />
      <el-table-column label="时长" align="center" prop="duration" width="80">
        <template #default="{ row }">{{ formatMusicDuration(row.duration) }}</template>
      </el-table-column>
      <el-table-column label="是否公开" align="center" prop="publicStatus" width="90">
        <template #default="{ row }">
          <el-switch
            v-model="row.publicStatus"
            :active-value="true"
            :inactive-value="false"
            :disabled="row.status !== AiMusicStatusEnum.SUCCESS || !checkPermi(['ai:music:update'])"
            @change="handleUpdatePublicStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="播放次数" align="center" prop="playCount" width="90" />
      <el-table-column label="失败原因" prop="errorMessage" min-width="200">
        <template #default="{ row }">
          <span v-if="row.status === AiMusicStatusEnum.FAIL" class="text-[var(--el-color-danger)]">
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
            v-hasPermi="['ai:music:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="isAiMusicRunning(row.status)"
            @click="handleDelete(row.id)"
            v-hasPermi="['ai:music:delete']"
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

  <!-- 详情弹窗 -->
  <MusicDetail ref="detailRef" />
  <!-- 列表试听：同一时间只播放一首 -->
  <audio
    ref="audioRef"
    class="hidden"
    @ended="playingId = undefined"
    @pause="playingId = undefined"
  ></audio>
</template>

<script setup lang="ts">
import { getIntDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import { MusicApi, MusicVO } from '@/api/ai/music'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { AiMusicStatusEnum, isAiMusicRunning } from '@/views/ai/utils/constants'
import { formatMusicDuration, getMusicTitle } from '@/views/ai/utils/utils'
import MusicDetail from './MusicDetail.vue'

/** AI 音乐 列表 */
defineOptions({ name: 'AiMusicManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MusicVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  title: undefined,
  status: undefined,
  generateMode: undefined,
  publicStatus: undefined,
  keyword: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MusicApi.getMusicPage(queryParams)
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
  stopPlay()
  detailRef.value.open(id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MusicApi.deleteMusic(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 修改是否公开 */
const handleUpdatePublicStatusChange = async (row: MusicVO) => {
  try {
    // 修改状态的二次确认
    const text = row.publicStatus ? '公开' : '取消公开'
    await message.confirm('确认要"' + text + '"该音乐吗?')
    // 发起修改状态
    await MusicApi.updateMusic({ id: row.id, publicStatus: row.publicStatus })
    message.success(t('common.updateSuccess'))
  } catch {
    row.publicStatus = !row.publicStatus
  }
}

/** 试听 */
const audioRef = ref<HTMLAudioElement>()
const playingId = ref<number>() // 正在播放的音乐编号
const canPlay = (row: MusicVO) => row.status === AiMusicStatusEnum.SUCCESS && !!row.audioUrl
const handlePlay = (row: MusicVO) => {
  const audio = audioRef.value
  if (!audio || !canPlay(row)) {
    return
  }
  if (playingId.value === row.id) {
    audio.pause()
    return
  }
  audio.src = row.audioUrl!
  audio
    .play()
    .then(() => (playingId.value = row.id))
    .catch(() => message.error('音频加载失败'))
}
const stopPlay = () => {
  audioRef.value?.pause()
}

/** 初始化 **/
onMounted(() => {
  getList()
})

onBeforeUnmount(stopPlay)
onDeactivated(stopPlay)
</script>
