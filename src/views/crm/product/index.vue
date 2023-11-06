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
      <el-form-item label="产品名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入产品名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品编码" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入产品编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.CRM_PRODUCT_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品分类" prop="categoryId">
        <el-input
          v-model="queryParams.categoryId"
          placeholder="请选择产品分类"
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
        <el-button type="primary" @click="openForm('create')" v-hasPermi="['crm:product:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['crm:product:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <!--<el-table-column label="主键id" align="center" prop="id" />-->
      <el-table-column label="产品名称" align="center" prop="name" />
      <el-table-column label="产品编码" align="center" prop="no" />
      <el-table-column label="单位" align="center" prop="unit">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PRODUCT_UNIT" :value="scope.row.unit" />
        </template>
      </el-table-column>
      <el-table-column label="价格" align="center" prop="price">
        <template #default="{ row }">
          {{ fenToYuan(row.price) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_PRODUCT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="产品分类" align="center" prop="categoryId">
        <template #default="{ row }">
          <span>{{ productCategoryList?.find((c) => c.id === row.categoryId)?.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="产品描述" align="center" prop="description" />
      <el-table-column label="负责人" align="center" prop="ownerUserId">
        <template #default="{ row }">
          <span>{{ userList?.find((c) => c.id === row.ownerUserId)?.nickname }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button
            v-hasPermi="['crm:product:query']"
            link
            type="primary"
            @click="openDetail(scope.row)"
          >
            详情
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['crm:product:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['crm:product:delete']"
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

  <!-- 表单弹窗：添加/修改 -->
  <ProductForm ref="formRef" @success="getList" />

  <!-- 表单弹窗：详情 -->
  <ProductDetail ref="detailRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getBoolDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as ProductApi from '@/api/crm/product'
import ProductForm from './ProductForm.vue'
import ProductDetail from './ProductDetail.vue'
import { fenToYuan } from '@/utils'
import * as ProductCategoryApi from '@/api/crm/productCategory'
import { getSimpleUserList, UserVO } from '@/api/system/user'

defineOptions({ name: 'CrmProduct' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  no: null,
  unit: null,
  price: null,
  status: null,
  categoryId: null,
  description: null,
  ownerUserId: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductApi.getProductPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
/** 详情操作 */
const detailRef = ref()
const openDetail = (data: ProductApi.ProductVO) => {
  detailRef.value.open(data)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProductApi.deleteProduct(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ProductApi.exportProduct(queryParams)
    download.excel(data, '产品.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

const productCategoryList = ref([]) // 产品分类树
const userList = ref<UserVO[]>([]) // 系统用户

/** 初始化 **/
onMounted(async () => {
  await getList()
  productCategoryList.value = await ProductCategoryApi.getProductCategoryList({})
  userList.value = await getSimpleUserList()
})
</script>
