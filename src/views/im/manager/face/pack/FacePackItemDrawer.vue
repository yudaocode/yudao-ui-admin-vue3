<template>
  <el-drawer v-model="drawerVisible" :title="drawerTitle" size="65%" destroy-on-close>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="表情名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入表情名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-160px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['im:manager:face-pack-item:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增表情
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="checkedIds.length === 0"
          @click="handleDeleteBatch"
          v-hasPermi="['im:manager:face-pack-item:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" />批量删除
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" @selection-change="handleRowCheckboxChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="表情图" align="center" prop="url" width="80">
        <template #default="scope">
          <el-image
            v-if="scope.row.url"
            :src="scope.row.url"
            :preview-src-list="[scope.row.url]"
            preview-teleported
            class="w-40px h-40px rounded"
            fit="contain"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="表情名"
        align="center"
        prop="name"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column label="尺寸" align="center" width="100">
        <template #default="scope">
          <span v-if="scope.row.width || scope.row.height">
            {{ scope.row.width || '?' }} × {{ scope.row.height || '?' }}
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['im:manager:face-pack-item:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['im:manager:face-pack-item:delete']"
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

    <FacePackItemForm ref="formRef" :pack-id="currentPackId" @success="getList" />
  </el-drawer>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ManagerFacePackItemApi from '@/api/im/manager/face/item'
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import FacePackItemForm from './FacePackItemForm.vue'

defineOptions({ name: 'ImManagerFacePackItemDrawer' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const drawerVisible = ref(false) // 抽屉的是否展示
const drawerTitle = ref('') // 抽屉的标题
const currentPackId = ref<number>(0) // 当前打开的表情包编号

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerFacePackItemApi.ImManagerFacePackItemVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  packId: 0,
  name: undefined as string | undefined,
  status: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 打开抽屉 */
const open = (pack: ImManagerFacePackVO) => {
  drawerVisible.value = true
  drawerTitle.value = `「${pack.name}」表情管理`
  currentPackId.value = pack.id
  // 重置查询条件 + 拉取当前包下的表情图
  queryParams.packId = pack.id
  queryParams.pageNo = 1
  queryParams.name = undefined
  queryParams.status = undefined
  void getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开抽屉

/** 查询表情图分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerFacePackItemApi.getManagerFacePackItemPage(queryParams)
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
  // 抽屉绑定的 packId 不能被重置清空，否则会查到全部包的表情
  queryParams.packId = currentPackId.value
  handleQuery()
}

/** 添加 / 修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
  } catch {
    return
  }
  // 发起删除
  await ManagerFacePackItemApi.deleteManagerFacePackItem(id)
  message.success(t('common.delSuccess'))
  // 刷新列表
  await getList()
}

const checkedIds = ref<number[]>([]) // 当前勾选的编号集合

/** 表格选中变化 */
const handleRowCheckboxChange = (rows: ManagerFacePackItemApi.ImManagerFacePackItemVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
  } catch {
    return
  }
  // 发起批量删除
  await ManagerFacePackItemApi.deleteManagerFacePackItemList(checkedIds.value)
  checkedIds.value = []
  message.success(t('common.delSuccess'))
  // 刷新列表
  await getList()
}
</script>
