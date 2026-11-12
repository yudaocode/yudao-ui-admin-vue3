<template>
  <doc-alert title="AI PPT 生成" url="https://doc.iocoder.cn/ai/ppt/" />

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
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_PPT_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
      <el-table-column label="用户" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="标题" prop="title" min-width="200" />
      <el-table-column label="封面" align="center" width="130" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-image
            v-if="row.coverUrl"
            :src="row.coverUrl"
            fit="cover"
            class="h-56px w-100px rounded-4px"
            :preview-src-list="[row.coverUrl]"
            preview-teleported
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="页数" align="center" width="90">
        <template #default="{ row }">{{ row.finishCount }} / {{ row.slideCount }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_PPT_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="errorMessage" min-width="200">
        <template #default="{ row }">
          <span v-if="row.status === AiPptStatusEnum.FAIL" class="text-[var(--el-color-danger)]">
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
      <el-table-column
        label="操作"
        align="center"
        width="220"
        fixed="right"
        :show-overflow-tooltip="false"
      >
        <!-- DONE @AI：行没对齐；貌似【删除】看不到； -->
        <template #default="{ row }">
          <div class="flex items-center justify-center">
            <el-button
              link
              type="primary"
              @click="openPreview(row.id)"
              v-hasPermi="['ai:ppt:query']"
            >
              预览
            </el-button>
            <el-button
              link
              type="primary"
              @click="openOutline(row.id)"
              v-hasPermi="['ai:ppt:query']"
            >
              查看大纲
            </el-button>
            <el-dropdown
              v-if="row.status === AiPptStatusEnum.SUCCESS"
              v-hasPermi="['ai:ppt:query']"
              trigger="click"
              :disabled="exportingId === row.id"
              @command="(format: AiPptExportFormatEnum) => handleExport(row, format)"
              class="ml-12px"
            >
              <el-button link type="primary" :loading="exportingId === row.id">导出</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="AiPptExportFormatEnum.PPTX">
                    导出 PPTX
                  </el-dropdown-item>
                  <el-dropdown-item :command="AiPptExportFormatEnum.PDF">
                    导出 PDF
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              link
              type="danger"
              class="ml-12px"
              :disabled="row.status === AiPptStatusEnum.IN_PROGRESS"
              @click="handleDelete(row.id)"
              v-hasPermi="['ai:ppt:delete']"
            >
              删除
            </el-button>
          </div>
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

  <!-- 预览、大纲：只读 -->
  <PptPreviewDialog ref="previewRef" readonly />
  <PptOutlineDialog ref="outlineRef" readonly />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { PptApi, PptVO } from '@/api/ai/ppt'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { AiPptExportFormatEnum, AiPptStatusEnum } from '@/views/ai/utils/constants'
import PptPreviewDialog from '../components/PptPreviewDialog.vue'
import PptOutlineDialog from '../components/PptOutlineDialog.vue'

/** AI PPT 列表 */
defineOptions({ name: 'AiPptManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<PptVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  title: undefined,
  status: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PptApi.getPptPage(queryParams)
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

/** 预览 */
const previewRef = ref()
const openPreview = (id: number) => {
  previewRef.value.open(id)
}

/** 查看大纲 */
const outlineRef = ref()
const openOutline = (id: number) => {
  outlineRef.value.open(id)
}

/** 导出：文件名取标题 */
const exportingId = ref<number>() // 导出中的 PPT 编号
const handleExport = async (row: PptVO, format: AiPptExportFormatEnum) => {
  exportingId.value = row.id
  try {
    const data = await PptApi.exportPpt(row.id, format)
    download[format](data, `${row.title}.${format}`)
  } finally {
    exportingId.value = undefined
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm('确定删除该 PPT 吗？只删除记录，图片文件不随之删除。')
    // 发起删除
    await PptApi.deletePpt(id)
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
