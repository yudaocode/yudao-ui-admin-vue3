<template>
  <doc-alert title="UReport2 报表" url="https://doc.iocoder.cn/report/ureport/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="报表名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入报表名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openFrame('design')"
          v-hasPermi="['report:ureport:design']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新建
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="报表名称" align="center" prop="name" min-width="200" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openFrame('design', scope.row.name)"
            v-hasPermi="['report:ureport:design']"
          >
            设计
          </el-button>
          <el-button
            link
            type="primary"
            @click="openFrame('preview', scope.row.name)"
            v-hasPermi="['report:ureport:query', 'report:ureport:design']"
          >
            预览
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row)"
            v-hasPermi="['report:ureport:design']"
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

  <!-- 设计器、预览弹窗 -->
  <UReportFrame ref="frameRef" @success="getList" />
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as UReportApi from '@/api/report/ureport'
import UReportFrame from './UReportFrame.vue'

defineOptions({ name: 'UReport' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<UReportApi.UReportFileVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UReportApi.getUReportFilePage(queryParams)
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

/** 新建、设计、预览操作 */
const frameRef = ref()
const openFrame = (type: 'design' | 'preview', name?: string) => {
  frameRef.value.open(type, name)
}

/** 删除按钮操作 */
const handleDelete = async (row: UReportApi.UReportFileVO) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await UReportApi.deleteUReportFile(row.id)
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
