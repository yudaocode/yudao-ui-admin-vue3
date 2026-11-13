<template>
  <doc-alert title="AI 语音生成" url="https://doc.iocoder.cn/ai/speech/" />

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
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="请选择平台" clearable class="!w-240px">
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
            v-for="(label, value) in AiSpeechStatusLabels"
            :key="value"
            :label="label"
            :value="Number(value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="朗读文本" prop="inputText">
        <el-input
          v-model="queryParams.inputText"
          placeholder="请输入朗读文本"
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
      <el-table-column label="朗读文本" prop="inputText" min-width="240" fixed="left" />
      <el-table-column label="用户" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">
            {{ AiSpeechStatusLabels[row.status] || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="row.platform" />
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="model" min-width="140" />
      <el-table-column label="音色" align="center" prop="voice" min-width="160">
        <template #default="{ row }">{{ getSpeechVoiceLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="格式" align="center" prop="format" width="90">
        <template #default="{ row }">{{ getSpeechFormatLabel(row.format) }}</template>
      </el-table-column>
      <el-table-column label="语速" align="center" prop="speed" width="80">
        <template #default="{ row }">{{ formatSpeechSpeed(row.speed) }}</template>
      </el-table-column>
      <el-table-column label="音频大小" align="center" prop="audioSize" width="100">
        <template #default="{ row }">{{ formatSpeechSize(row.audioSize) }}</template>
      </el-table-column>
      <el-table-column label="失败原因" prop="errorMessage" min-width="200">
        <template #default="{ row }">
          <span
            v-if="row.status === AiSpeechStatusEnum.FAIL"
            class="text-[var(--el-color-danger)]"
          >
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
            v-hasPermi="['ai:speech:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="isSpeechRunning(row)"
            @click="handleDelete(row.id)"
            v-hasPermi="['ai:speech:delete']"
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
  <SpeechDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { SpeechApi, SpeechVO } from '@/api/ai/speech'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import {
  AiSpeechStatusEnum,
  AiSpeechStatusLabels,
  formatSpeechSize,
  formatSpeechSpeed,
  getSpeechFormatLabel,
  getSpeechVoiceLabel,
  isSpeechRunning
} from '@/views/ai/utils/speech'
import SpeechDetail from './SpeechDetail.vue'

/** AI 语音 列表 */
defineOptions({ name: 'AiSpeechManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<SpeechVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  platform: undefined,
  status: undefined,
  inputText: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SpeechApi.getSpeechPage(queryParams)
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

/** 状态的标签类型 */
const getStatusTagType = (status: number) => {
  if (status === AiSpeechStatusEnum.SUCCESS) {
    return 'success'
  }
  return status === AiSpeechStatusEnum.FAIL ? 'danger' : 'primary'
}

/** 详情 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value.open(id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SpeechApi.deleteSpeech(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
