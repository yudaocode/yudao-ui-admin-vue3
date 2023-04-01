<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="属性项" prop="propertyId">
        <el-select v-model="queryParams.propertyId">
          <el-option
            v-for="item in propertyOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" @click="openModal('create')" v-hasPermi="['infra:config:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" align="center">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['infra:config:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['infra:config:delete']"
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
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <value-form ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="Config">
import { dateFormatter } from '@/utils/formatTime'
import * as PropertyApi from '@/api/mall/product/property'
import ValueForm from './form.vue'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const propertyOptions = ref<any[]>([])
const defaultPropertyId = ref()
const queryParams = reactive<any>({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  propertyId: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PropertyApi.getPropertyValuePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 属性项下拉框数据 */
const getPropertyList = async () => {
  const data = await PropertyApi.getPropertyList({})
  propertyOptions.value = data
}

/** 查询字典类型详细 */
const getProperty = async (propertyId: number) => {
  const data = await PropertyApi.getProperty(propertyId)
  queryParams.propertyId = data.id
  defaultPropertyId.value = data.id
  await getList()
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
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, defaultPropertyId, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PropertyApi.deleteProperty(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
const router = useRouter()
onMounted(() => {
  const propertyId: number =
    router.currentRoute.value.params && (router.currentRoute.value.params.propertyId as any)
  getProperty(propertyId)
  getPropertyList()
})
</script>
