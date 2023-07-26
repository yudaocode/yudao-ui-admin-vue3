<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="商品名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入商品名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品分类" prop="categoryId">
        <el-tree-select
          v-model="queryParams.categoryId"
          :data="categoryList"
          :props="defaultProps"
          check-strictly
          class="w-1/1"
          node-key="id"
          placeholder="请选择商品分类"
          @change="nodeClick"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
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
        <el-button v-hasPermi="['product:spu:create']" plain type="primary" @click="openForm">
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['product:spu:export']"
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

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs v-model="queryParams.tabType" @tab-click="handleTabClick">
      <el-tab-pane
        v-for="item in tabsData"
        :key="item.type"
        :label="item.name + '(' + item.count + ')'"
        :name="item.type"
      />
    </el-tabs>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="expand" width="30">
        <template #default="{ row }">
          <el-form class="demo-table-expand" label-position="left">
            <el-row>
              <el-col :span="24">
                <el-row>
                  <el-col :span="8">
                    <el-form-item label="商品分类:">
                      <span>{{ categoryString(row.categoryId) }}</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="市场价:">
                      <span>{{ formatToFraction(row.marketPrice) }}</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="成本价:">
                      <span>{{ formatToFraction(row.costPrice) }}</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-row>
                  <el-col :span="8">
                    <el-form-item label="收藏:">
                      <!-- TODO 没有这个属性，暂时写死 5 个 -->
                      <span>5</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="虚拟销量:">
                      <span>{{ row.virtualSalesCount }}</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column key="id" align="center" label="商品编号" prop="id" />
      <el-table-column label="商品图" min-width="80">
        <template #default="{ row }">
          <el-image :src="row.picUrl" class="w-30px h-30px" @click="imagePreview(row.picUrl)" />
        </template>
      </el-table-column>
      <el-table-column :show-overflow-tooltip="true" label="商品名称" min-width="300" prop="name" />
      <el-table-column align="center" label="商品售价" min-width="90" prop="price">
        <template #default="{ row }">
          {{ formatToFraction(row.price) }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="销量" min-width="90" prop="salesCount" />
      <el-table-column align="center" label="库存" min-width="90" prop="stock" />
      <el-table-column align="center" label="排序" min-width="70" prop="sort" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" label="状态" min-width="80">
        <template #default="{ row }">
          <template v-if="row.status >= 0">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="上架"
              inactive-text="下架"
              inline-prompt
              @change="changeStatus(row)"
            />
          </template>
          <template v-else>
            <el-tag type="info">回收站</el-tag>
          </template>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" min-width="200">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['product:spu:update']"
            link
            type="primary"
            @click="openDetail(row.id)"
          >
            详情
          </el-button>
          <template v-if="queryParams.tabType === 4">
            <el-button
              v-hasPermi="['product:spu:delete']"
              link
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
            <el-button
              v-hasPermi="['product:spu:update']"
              link
              type="primary"
              @click="changeStatus(row, ProductSpuStatusEnum.DISABLE.status)"
            >
              恢复到仓库
            </el-button>
          </template>
          <template v-else>
            <!-- 只有不是上架和回收站的商品可以编辑 -->
            <el-button
              v-if="queryParams.tabType !== 0"
              v-hasPermi="['product:spu:update']"
              link
              type="primary"
              @click="openForm(row.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['product:spu:update']"
              link
              type="primary"
              @click="changeStatus(row, ProductSpuStatusEnum.RECYCLE.status)"
            >
              加入回收站
            </el-button>
          </template>
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
</template>
<script lang="ts" setup>
import { TabsPaneContext } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { createImageViewer } from '@/components/ImageViewer'
import { dateFormatter } from '@/utils/formatTime'
import { checkSelectedNode, defaultProps, handleTree, treeToString } from '@/utils/tree'
import { ProductSpuStatusEnum } from '@/utils/constants'
import { formatToFraction } from '@/utils'
import download from '@/utils/download'
import * as ProductSpuApi from '@/api/mall/product/spu'
import * as ProductCategoryApi from '@/api/mall/product/category'

defineOptions({ name: 'ProductSpu' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { currentRoute, push } = useRouter() // 路由跳转

const loading = ref(false) // 列表的加载中
const exportLoading = ref(false) // 导出的加载中
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据
// tabs 数据
const tabsData = ref([
  {
    count: 0,
    name: '出售中商品',
    type: 0
  },
  {
    count: 0,
    name: '仓库中商品',
    type: 1
  },
  {
    count: 0,
    name: '已经售空商品',
    type: 2
  },
  {
    count: 0,
    name: '警戒库存',
    type: 3
  },
  {
    count: 0,
    name: '商品回收站',
    type: 4
  }
])

/** 获得每个 Tab 的数量 */
const getTabsCount = async () => {
  const res = await ProductSpuApi.getTabsCount()
  for (let objName in res) {
    tabsData.value[Number(objName)].count = res[objName]
  }
}
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  tabType: 0,
  name: '',
  categoryId: null,
  createTime: []
}) // 查询参数
const queryFormRef = ref() // 搜索的表单Ref

const handleTabClick = (tab: TabsPaneContext) => {
  queryParams.value.tabType = tab.paneName as number
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductSpuApi.getSpuPage(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/**
 * 更改 SPU 状态
 *
 * @param row
 * @param status 更改前的值
 */
const changeStatus = async (row, status?: number) => {
  const deepCopyValue = cloneDeep(unref(row))
  if (typeof status !== 'undefined') deepCopyValue.status = status
  try {
    let text = ''
    switch (deepCopyValue.status) {
      case ProductSpuStatusEnum.DISABLE.status:
        text = ProductSpuStatusEnum.DISABLE.name
        break
      case ProductSpuStatusEnum.ENABLE.status:
        text = ProductSpuStatusEnum.ENABLE.name
        break
      case ProductSpuStatusEnum.RECYCLE.status:
        text = `加入${ProductSpuStatusEnum.RECYCLE.name}`
        break
    }
    await message.confirm(
      deepCopyValue.status === -1
        ? `确认要将[${row.name}]${text}吗？`
        : row.status === -1 // 再判断一次原对象是否等于-1，例: 把回收站中的商品恢复到仓库中，事件触发时原对象status为-1 深拷贝对象status被赋值为0
        ? `确认要将[${row.name}]恢复到仓库吗？`
        : `确认要${text}[${row.name}]吗？`
    )
    await ProductSpuApi.updateStatus({ id: deepCopyValue.id, status: deepCopyValue.status })
    message.success('更新状态成功')
    // 刷新 tabs 数据
    await getTabsCount()
    // 刷新列表
    await getList()
  } catch {
    // 取消更改状态时回显数据
    row.status =
      row.status === ProductSpuStatusEnum.DISABLE.status
        ? ProductSpuStatusEnum.ENABLE.status
        : ProductSpuStatusEnum.DISABLE.status
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProductSpuApi.deleteSpu(id)
    message.success(t('common.delSuccess'))
    // 刷新tabs数据
    await getTabsCount()
    // 刷新列表
    await getList()
  } catch {}
}

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/**
 * 新增或修改
 *
 * @param id 商品 SPU 编号
 */
const openForm = (id?: number) => {
  // 修改
  if (typeof id === 'number') {
    push('/product/spu/edit/' + id)
    return
  }
  // 新增
  push({ name: 'ProductSpuAdd' })
}

/**
 * 查看商品详情
 */
const openDetail = (id?: number) => {
  push('/product/spu/detail/' + id)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ProductSpuApi.exportSpu(queryParams)
    download.excel(data, '商品列表.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// 监听路由变化更新列表，解决商品保存后，列表不刷新的问题。
watch(
  () => currentRoute.value,
  () => {
    getList()
  }
)

const categoryList = ref() // 分类树
/**
 * 获取分类的节点的完整结构
 * @param categoryId 分类id
 */
const categoryString = (categoryId) => {
  return treeToString(categoryList.value, categoryId)
}

/**
 * 校验所选是否为二级及以下节点
 */
const nodeClick = () => {
  if (!checkSelectedNode(categoryList.value, queryParams.value.categoryId)) {
    queryParams.value.categoryId = null
    message.warning('必须选择二级及以下节点！！')
  }
}

/** 初始化 **/
onMounted(async () => {
  await getTabsCount()
  await getList()
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
})
</script>
<style lang="scss" scoped>
.demo-table-expand {
  padding-left: 42px;

  :deep(.el-form-item__label) {
    width: 82px;
    font-weight: bold;
    color: #99a9bf;
  }
}
</style>
