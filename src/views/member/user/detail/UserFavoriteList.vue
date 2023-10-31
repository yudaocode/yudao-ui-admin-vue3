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
      <el-form-item label="商品名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入商品名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="收藏时间" prop="createTime">
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
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column key="id" align="center" label="商品编号" width="180" prop="id" />
      <el-table-column label="商品图" min-width="80">
        <template #default="{ row }">
          <el-image :src="row.picUrl" class="h-30px w-30px" @click="imagePreview(row.picUrl)" />
        </template>
      </el-table-column>
      <el-table-column :show-overflow-tooltip="true" label="商品名称" min-width="300" prop="name" />
      <el-table-column align="center" label="商品售价" min-width="90" prop="price">
        <template #default="{ row }"> {{ floatToFixed2(row.price) }}元</template>
      </el-table-column>
      <el-table-column align="center" label="销量" min-width="90" prop="salesCount" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="收藏时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" label="状态" min-width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" min-width="200">
        <template #default="{ row }">
          <el-button
            v-if="row.favoriteStatus === 0"
            v-hasPermi="['product:spu:delete']"
            link
            type="danger"
            @click="handleAdd(row)"
          >
            收藏
          </el-button>
          <el-button
            v-if="row.favoriteStatus === 1"
            v-hasPermi="['product:spu:delete']"
            link
            type="danger"
            @click="handleDelete(row)"
          >
            取消收藏
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
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as FavoriteApi from '@/api/mall/product/favorite'
import { floatToFixed2 } from '@/utils'

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  createTime: [],
  userId: NaN
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await FavoriteApi.getFavoritePage(queryParams)
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

/** 取消收藏按钮操作 */
const handleDelete = async (row: object) => {
  try {
    console.log(row)
    // 取消的二次确认
    await message.delStarConfirm()
    // 发起取消
    await FavoriteApi.delFavorite({ userId: queryParams.userId, spuId: row.spuId })
    message.success(t('common.delStarSuccess'))
    row.favoriteStatus = 0
    // 刷新列表
    // await getList()
  } catch {}
}

/** 收藏按钮操作 */
const handleAdd = async (row: object) => {
  try {
    const data = { userId: queryParams.userId, spuId: row.spuId }
    // 发起收藏
    const result = await FavoriteApi.exitsFavorite(data)
    if (result === false) {
      // 发起收藏
      await FavoriteApi.createFavorite(data)
      message.success(t('common.starSuccess'))
      row.favoriteStatus = 1
      // 刷新列表
      // await getList()
    } else {
      message.warning(t('common.existStar'))
      row.favoriteStatus = 1
    }
  } catch {}
}

const { userId } = defineProps({
  userId: {
    type: Number,
    required: true
  }
})

/** 初始化 **/
onMounted(() => {
  queryParams.userId = userId
  getList()
})
</script>
