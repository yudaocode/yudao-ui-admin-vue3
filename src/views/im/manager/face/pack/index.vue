<template>
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="表情包" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入表情包名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['im:manager:face-pack:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="checkedIds.length === 0"
          @click="handleDeleteBatch"
          v-hasPermi="['im:manager:face-pack:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" />批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" @selection-change="handleRowCheckboxChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="编号" align="center" prop="id" width="100" />
      <el-table-column label="封面" align="center" prop="icon" width="80">
        <template #default="scope">
          <el-image
            v-if="scope.row.icon"
            :src="scope.row.icon"
            :preview-src-list="[scope.row.icon]"
            preview-teleported
            class="w-32px h-32px rounded"
            fit="contain"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="名称"
        align="center"
        prop="name"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openItemDrawer(scope.row)"
            v-hasPermi="['im:manager:face-pack-item:query']"
          >
            管理表情
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['im:manager:face-pack:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['im:manager:face-pack:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <FacePackForm ref="formRef" @success="getList" />
  <FacePackItemDrawer ref="itemDrawerRef" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ManagerFacePackApi from '@/api/im/manager/face/pack'
import FacePackForm from './FacePackForm.vue'
import FacePackItemDrawer from './FacePackItemDrawer.vue'

defineOptions({ name: 'ImManagerFacePack' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref<ManagerFacePackApi.ImManagerFacePackVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref()

/** 查询表情包分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerFacePackApi.getManagerFacePackPage(queryParams)
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

/** 打开表情包新增 / 修改弹窗 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开表情包详情抽屉（管理包内表情图） */
const itemDrawerRef = ref()
const openItemDrawer = (pack: ManagerFacePackApi.ImManagerFacePackVO) => {
  itemDrawerRef.value.open(pack)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
  } catch {
    return
  }
  await ManagerFacePackApi.deleteManagerFacePack(id)
  message.success(t('common.delSuccess'))
  await getList()
}

/** 表格选中变化 */
const checkedIds = ref<number[]>([])
const handleRowCheckboxChange = (rows: ManagerFacePackApi.ImManagerFacePackVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
  } catch {
    return
  }
  await ManagerFacePackApi.deleteManagerFacePackList(checkedIds.value)
  checkedIds.value = []
  message.success(t('common.delSuccess'))
  await getList()
}

onMounted(() => {
  getList()
})
</script>
