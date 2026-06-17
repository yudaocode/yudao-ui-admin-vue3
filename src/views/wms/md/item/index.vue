<!-- WMS 商品管理 -->
<template>
  <doc-alert title="【基础】商品、SKU、分类、品牌" url="https://doc.iocoder.cn/wms/md/item/" />

  <el-row :gutter="20">
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <ItemCategoryTree ref="categoryTreeRef" @node-click="handleCategoryNodeClick" />
      </ContentWrap>
    </el-col>
    <el-col :span="20" :xs="24">
      <!-- 搜索工作栏 -->
      <ContentWrap>
        <el-form
          ref="queryFormRef"
          :inline="true"
          :model="queryParams"
          class="-mb-15px"
          label-width="68px"
        >
          <el-form-item label="商品编号" prop="code">
            <el-input
              v-model="queryParams.code"
              class="!w-240px"
              clearable
              placeholder="请输入商品编号"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="商品名称" prop="name">
            <el-input
              v-model="queryParams.name"
              class="!w-240px"
              clearable
              placeholder="请输入商品名称"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="商品品牌" prop="brandId">
            <ItemBrandSelect v-model="queryParams.brandId" class="!w-240px" />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon class="mr-5px" icon="ep:search" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon class="mr-5px" icon="ep:refresh" />
              重置
            </el-button>
            <el-button
              v-hasPermi="['wms:item:create']"
              plain
              type="primary"
              @click="openForm('create')"
            >
              <Icon class="mr-5px" icon="ep:plus" />
              新增
            </el-button>
            <el-button
              v-hasPermi="['wms:item:export']"
              :loading="exportLoading"
              plain
              type="success"
              @click="handleExport"
            >
              <Icon class="mr-5px" icon="ep:download" />
              导出
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 商品列表 -->
      <ContentWrap>
        <el-table
          v-loading="loading"
          :data="list"
          :show-overflow-tooltip="true"
          :span-method="spanMethod"
        >
          <el-table-column label="商品信息" min-width="220">
            <template #default="scope">
              <div class="text-14px">{{ scope.row.itemName }}</div>
              <div v-if="scope.row.itemCode" class="text-12px text-gray-500">
                {{ scope.row.itemCode }}
              </div>
              <div v-if="scope.row.brandName" class="text-12px text-gray-500">
                品牌：{{ scope.row.brandName }}
              </div>
              <div v-if="scope.row.categoryName" class="text-12px text-gray-500">
                分类：{{ scope.row.categoryName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="规格信息" min-width="180">
            <template #default="scope">
              <div class="text-14px">{{ scope.row.name }}</div>
              <div v-if="scope.row.code" class="text-12px text-gray-500">
                编号：{{ scope.row.code }}
              </div>
              <div v-if="scope.row.barCode" class="text-12px text-gray-500">
                条码：{{ scope.row.barCode }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额(元)" min-width="140">
            <template #default="scope">
              <div v-if="!isNullOrUnDef(scope.row.costPrice)">
                成本价：{{ formatPrice(scope.row.costPrice) }}
              </div>
              <div v-if="!isNullOrUnDef(scope.row.sellingPrice)">
                销售价：{{ formatPrice(scope.row.sellingPrice) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="重量(kg)" min-width="140">
            <template #default="scope">
              <div v-if="!isNullOrUnDef(scope.row.netWeight)">
                净重：{{ formatWeight(scope.row.netWeight) }}
              </div>
              <div v-if="!isNullOrUnDef(scope.row.grossWeight)">
                毛重：{{ formatWeight(scope.row.grossWeight) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column align="right" label="长宽高(cm)" min-width="180">
            <template #default="scope">
              {{ formatDimensionText(scope.row.length, scope.row.width, scope.row.height) }}
            </template>
          </el-table-column>
          <el-table-column align="center" label="操作" width="120">
            <template #default="scope">
              <el-button
                v-hasPermi="['wms:item:update']"
                link
                type="primary"
                @click="openForm('update', scope.row.itemId)"
              >
                修改
              </el-button>
              <el-button
                v-hasPermi="['wms:item:delete']"
                link
                type="danger"
                @click="handleDelete(scope.row.itemId, scope.row.itemName)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <Pagination
          v-model:limit="queryParams.pageSize"
          v-model:page="queryParams.pageNo"
          :total="total"
          @pagination="getList"
        />
      </ContentWrap>
    </el-col>
  </el-row>

  <!-- 表单弹窗：添加/修改 -->
  <ItemForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import download from '@/utils/download'
import { ItemApi, ItemVO } from '@/api/wms/md/item'
import { ItemSkuVO } from '@/api/wms/md/item/sku'
import ItemForm from './ItemForm.vue'
import ItemCategoryTree from './category/components/ItemCategoryTree.vue'
import ItemBrandSelect from './brand/components/ItemBrandSelect.vue'
import { isNullOrUnDef } from '@/utils/is'
import { formatDimensionText, formatPrice, formatWeight } from '@/views/wms/utils/format'

/** WMS 商品管理 */
defineOptions({ name: 'WmsItem' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ItemSkuVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive<{
  pageNo: number
  pageSize: number
  code?: string
  name?: string
  categoryId?: number
  brandId?: number
}>({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  categoryId: undefined,
  brandId: undefined
})
const queryFormRef = ref() // 搜索的表单
const categoryTreeRef = ref() // 分类树
const exportLoading = ref(false) // 导出的加载中

/** 查询商品列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ItemApi.getItemPage(queryParams)
    list.value = buildItemSkuRows(data.list || [])
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 展开商品 SKU 列表 */
const buildItemSkuRows = (items: ItemVO[]) => {
  return items.flatMap((item) => {
    const skus = item.skus?.length ? item.skus : [{}]
    return skus.map((sku) => ({
      ...sku,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      unit: item.unit,
      brandId: item.brandId,
      brandName: item.brandName
    }))
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  categoryTreeRef.value?.reset()
  queryParams.categoryId = undefined
  handleQuery()
}

/** 分类树点击 */
const handleCategoryNodeClick = (categoryId: number | undefined) => {
  queryParams.categoryId = categoryId
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除商品 */
const handleDelete = async (id: number, name?: string) => {
  try {
    // 删除的二次确认
    await message.confirm('确认删除商品【' + name + '】吗？')
    // 发起删除
    await ItemApi.deleteItem(id)
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
    const data = await ItemApi.exportItem(queryParams)
    download.excel(data, '商品.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 合并商品维度的重复单元格 */
const spanMethod = ({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => {
  if (![0, 5].includes(columnIndex)) {
    return { rowspan: 1, colspan: 1 }
  }
  const row = list.value[rowIndex]
  if (rowIndex > 0 && list.value[rowIndex - 1]?.itemId === row.itemId) {
    return { rowspan: 0, colspan: 0 }
  }
  let rowspan = 1
  for (let index = rowIndex + 1; index < list.value.length; index++) {
    if (list.value[index]?.itemId !== row.itemId) {
      break
    }
    rowspan++
  }
  return { rowspan, colspan: 1 }
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
