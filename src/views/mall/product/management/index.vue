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
        <el-button
          v-hasPermi="['product:brand:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs v-model="queryParams.type" @tab-click="getList">
      <el-tab-pane
        v-for="(item, index) in headerNum"
        :key="index"
        :label="item.name + '(' + item.count + ')'"
        :name="item.type.toString()"
      />
    </el-tabs>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-form class="demo-table-expand" inline label-position="left">
            <el-form-item label="市场价：">
              <span>{{ row.marketPrice }}</span>
            </el-form-item>
            <el-form-item label="成本价：">
              <span>{{ row.costPrice }}</span>
            </el-form-item>
            <el-form-item label="虚拟销量：">
              <span>{{ row.virtualSalesCount }}</span>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column label="商品图" min-width="80">
        <template #default="{ row }">
          <div class="demo-image__preview">
            <el-image
              :preview-src-list="[row.image]"
              :src="row.image"
              style="width: 36px; height: 36px"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :show-overflow-tooltip="true"
        label="商品名称"
        min-width="300"
        prop="storeName"
      />
      <el-table-column align="center" label="商品售价" min-width="90" prop="price" />
      <el-table-column align="center" label="销量" min-width="90" prop="sales" />
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
          <!--TODO 暂时用COMMON_STATUS占位一下使其不报错       -->
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" min-width="150" />
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
<script lang="ts" name="ProductManagement" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'

// const message = useMessage() // 消息弹窗
// const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由跳转
const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据
const headerNum = ref([
  {
    count: 8,
    name: '出售中商品',
    type: 1
  },
  {
    count: 0,
    name: '仓库中商品',
    type: 2
  },
  {
    count: 0,
    name: '已经售馨商品',
    type: 3
  },
  {
    count: 0,
    name: '警戒库存',
    type: 4
  },
  {
    count: 0,
    name: '商品回收站',
    type: 5
  }
])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
  createTime: [],
  type: '1'
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // const data = await ProductBrandApi.getBrandParam(queryParams)
    // list.value = data.list
    // total.value = data.total
  } finally {
    loading.value = false
  }
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

const openForm = () => {
  push('/product/productManagementAdd')
}

/** 删除按钮操作 */
// const handleDelete = async (id: number) => {
//   try {
//     // 删除的二次确认
//     await message.delConfirm()
//     // 发起删除
//     await ProductBrandApi.deleteBrand(id)
//     message.success(t('common.delSuccess'))
//     // 刷新列表
//     await getList()
//   } catch {}
// }

/** 初始化 **/
onMounted(() => {
  // getList()
})
</script>
