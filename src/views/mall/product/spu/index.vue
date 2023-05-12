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
      <!-- TODO @puhui999：https://admin.java.crmeb.net/store/index，参考，使用分类 + 标题搜索 -->
      <el-form-item label="品牌名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入品牌名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-240px" clearable placeholder="请选择状态">
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
        <el-button v-hasPermi="['product:brand:create']" plain type="primary" @click="openForm">
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <!-- TODO @puhui999：增加一个【导出】操作 -->
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs v-model="queryParams.tabType" @tab-click="handleClick">
      <el-tab-pane
        v-for="item in tabsData"
        :key="item.type"
        :label="item.name + '(' + item.count + ')'"
        :name="item.type"
      />
    </el-tabs>
    <el-table v-loading="loading" :data="list">
      <!-- TODO puhui999: ID 编号的展示 -->
      <!--   TODO 暂时不做折叠数据   -->
      <!--      <el-table-column type="expand">-->
      <!--        <template #default="{ row }">-->
      <!--          <el-form inline label-position="left">-->
      <!--            <el-form-item label="市场价：">-->
      <!--              <span>{{ row.marketPrice }}</span>-->
      <!--            </el-form-item>-->
      <!--            <el-form-item label="成本价：">-->
      <!--              <span>{{ row.costPrice }}</span>-->
      <!--            </el-form-item>-->
      <!--            <el-form-item label="虚拟销量：">-->
      <!--              <span>{{ row.virtualSalesCount }}</span>-->
      <!--            </el-form-item>-->
      <!--          </el-form>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column label="商品图" min-width="80">
        <template #default="{ row }">
          <el-image
            :src="row.picUrl"
            style="width: 36px; height: 36px"
            @click="imagePreview(row.picUrl)"
          />
        </template>
      </el-table-column>
      <el-table-column :show-overflow-tooltip="true" label="商品名称" min-width="300" prop="name" />
      <!-- TODO 价格 / 100.0 -->
      <el-table-column align="center" label="商品售价" min-width="90" prop="price" />
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
      <el-table-column fixed="right" label="状态" min-width="80">
        <template #default="{ row }">
          <!-- TODO @puhui：是不是不用 Number(row.status) 去比较哈，直接 row.status < 0 -->
          <el-switch
            v-model="row.status"
            :active-value="1"
            :disabled="Number(row.status) < 0"
            :inactive-value="0"
            active-text="上架"
            inactive-text="下架"
            inline-prompt
            @change="changeStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" min-width="150">
        <template #default="{ row }">
          <!-- TODO @puhui999：【详情】，可以后面点做哈 -->
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
              @click="addToTrash(row, ProductSpuStatusEnum.DISABLE.status)"
            >
              恢复到仓库
            </el-button>
          </template>
          <template v-else>
            <el-button
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
              @click="addToTrash(row, ProductSpuStatusEnum.RECYCLE.status)"
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
  <!-- https://kailong110120130.gitee.io/vue-element-plus-admin-doc/components/image-viewer.html，可以用这个么？ -->
  <!-- 必须在表格外面展示。不然单元格会遮挡图层 -->
  <el-image-viewer
    v-if="imgViewVisible"
    :url-list="imageViewerList"
    @close="imgViewVisible = false"
  />
</template>
<script lang="ts" name="ProductList" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
// TODO @puhui999：managementApi=》ProductSpuApi
import * as managementApi from '@/api/mall/product/management/spu'
import { ProductSpuStatusEnum } from '@/utils/constants'
import { TabsPaneContext } from 'element-plus'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { currentRoute, push } = useRouter() // 路由跳转

const loading = ref(false) // 列表的加载中
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
  // TODO @puhui999：这里是不是可以不要 try catch 哈
  try {
    const res = await managementApi.getTabsCount()
    for (let objName in res) {
      tabsData.value[Number(objName)].count = res[objName]
    }
  } catch {}
}

const imgViewVisible = ref(false) // 商品图预览
const imageViewerList = ref<string[]>([]) // 商品图预览列表
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  tabType: 0
})
const queryFormRef = ref() // 搜索的表单

// TODO @puhui999：可以改成 handleTabClick：更准确一点；
const handleClick = (tab: TabsPaneContext) => {
  queryParams.value.tabType = tab.paneName
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await managementApi.getSpuList(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

// TODO @puhui999：是不是 changeStatus 和 addToTrash 调用一个统一的方法，去更新状态。这样逻辑会更干净一些。
/**
 * 更改 SPU 状态
 *
 * @param row
 * @param status 更改前的值
 */
const changeStatus = async (row, status?: number) => {
  // TODO 测试过程中似乎有点问题，下一版修复
  try {
    let text = ''
    switch (row.status) {
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
      row.status === -1 ? `确认要将[${row.name}]${text}吗？` : `确认要${text}[${row.name}]吗？`
    )
    await managementApi.updateStatus({ id: row.id, status: row.status })
    message.success('更新状态成功')
    // 刷新 tabs 数据
    await getTabsCount()
    // 刷新列表
    await getList()
  } catch {
    // 取消加入回收站时回显数据
    if (typeof status !== 'undefined') {
      row.status = status
      return
    }
    // 取消更改状态时回显数据
    row.status =
      row.status === ProductSpuStatusEnum.DISABLE.status
        ? ProductSpuStatusEnum.ENABLE.status
        : ProductSpuStatusEnum.DISABLE.status
  }
}

/**
 * 加入回收站
 *
 * @param row
 * @param status
 */
const addToTrash = (row, status) => {
  // 复制一份原值
  const num = Number(`${row.status}`)
  row.status = status
  changeStatus(row, num)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await managementApi.deleteSpu(id)
    message.success(t('common.delSuccess'))
    // 刷新tabs数据
    await getTabsCount()
    // 刷新列表
    await getList()
  } catch {}
}

/**
 * 商品图预览
 * @param imgUrl
 */
const imagePreview = (imgUrl: string) => {
  imageViewerList.value = [imgUrl]
  imgViewVisible.value = true
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
    push('/product/productManagementAdd?id=' + id)
    return
  }
  // 新增
  push('/product/productManagementAdd')
}

// 监听路由变化更新列表 TODO @puhui999：这个是必须加的么？
watch(
  () => currentRoute.value,
  () => {
    getList()
  },
  {
    immediate: true
  }
)

/** 初始化 **/
onMounted(() => {
  getTabsCount()
  getList()
})
</script>
