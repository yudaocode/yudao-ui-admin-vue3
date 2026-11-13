<template>
  <doc-alert title="OCR 文字识别" url="https://doc.iocoder.cn/ai/ocr/" />

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
          <el-option label="识别成功" :value="AiOcrStatusEnum.SUCCESS" />
          <el-option label="识别失败" :value="AiOcrStatusEnum.FAIL" />
        </el-select>
      </el-form-item>
      <el-form-item label="文件名" prop="fileName">
        <el-input
          v-model="queryParams.fileName"
          placeholder="请输入文件名"
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
      <el-table-column label="图片" align="center" prop="imageUrl" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.imageUrl"
            :src="row.imageUrl"
            :preview-src-list="[row.imageUrl]"
            preview-teleported
            fit="cover"
            class="h-40px w-40px rounded-4px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="文件名" prop="fileName" min-width="200" />
      <el-table-column label="用户" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'danger'">
            {{ row.status === AiOcrStatusEnum.SUCCESS ? '识别成功' : '识别失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="row.platform" />
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="modelName" min-width="160">
        <template #default="{ row }">{{ row.modelName || row.model || '-' }}</template>
      </el-table-column>
      <el-table-column label="耗时" align="center" prop="duration" width="100">
        <template #default="{ row }">{{ formatOcrDuration(row.duration) }}</template>
      </el-table-column>
      <el-table-column label="是否修订" align="center" prop="editedText" width="90">
        <template #default="{ row }">
          {{ row.editedText !== null && row.editedText !== undefined ? '是' : '否' }}
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="errorMessage" min-width="200">
        <template #default="{ row }">
          <span v-if="row.status === AiOcrStatusEnum.FAIL" class="text-[var(--el-color-danger)]">
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
            v-hasPermi="['ai:ocr:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['ai:ocr:delete']"
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
  <OcrDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { OcrApi, OcrVO } from '@/api/ai/ocr'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { AiOcrStatusEnum } from '@/views/ai/utils/constants'
import OcrDetail from './OcrDetail.vue'

/** AI 文字识别 列表 */
defineOptions({ name: 'AiOcrManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<OcrVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  platform: undefined,
  status: undefined,
  fileName: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OcrApi.getOcrPage(queryParams)
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

/** 识别耗时：毫秒转秒 */
const formatOcrDuration = (duration?: number) => {
  if (duration === undefined || duration === null) {
    return '-'
  }
  return `${(duration / 1000).toFixed(1)} 秒`
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
    await OcrApi.deleteOcr(id)
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
