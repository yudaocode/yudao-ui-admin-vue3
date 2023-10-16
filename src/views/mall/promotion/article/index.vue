<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="80px"
    >
      <el-form-item label="文章分类" prop="categoryId">
        <el-select
          v-model="queryParams.categoryId"
          class="!w-240px"
          placeholder="全部"
          @keyup.enter="handleQuery"
        >
          <el-option
            v-for="item in categoryList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="文章标题" prop="title">
        <el-input
          v-model="queryParams.title"
          class="!w-240px"
          clearable
          placeholder="请输入文章标题"
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
          v-hasPermi="['promotion:article:create']"
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
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="编号" prop="id" min-width="60" />
      <el-table-column align="center" label="封面" prop="picUrl" min-width="80">
        <template #default="{ row }">
          <el-image :src="row.picUrl" class="h-30px w-30px" @click="imagePreview(row.picUrl)" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="标题" prop="title" min-width="180" />
      <el-table-column align="center" label="分类" prop="categoryId" min-width="180">
        <template #default="scope">
          {{ categoryList.find((item) => item.id === scope.row.categoryId)?.name }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="浏览量" prop="browseCount" min-width="180" />
      <el-table-column align="center" label="作者" prop="author" min-width="180" />
      <el-table-column align="center" label="文章简介" prop="introduction" min-width="250" />
      <el-table-column align="center" label="排序" prop="sort" min-width="60" />
      <el-table-column align="center" label="状态" prop="status" min-width="60">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="发布时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-button
            v-hasPermi="['promotion:article:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['promotion:article:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
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

  <!-- 表单弹窗：添加/修改 -->
  <ArticleForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ArticleApi from '@/api/mall/promotion/article'
import ArticleForm from './ArticleForm.vue'
import * as ArticleCategoryApi from '@/api/mall/promotion/articleCategory'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { createImageViewer } from '@/components/ImageViewer'

defineOptions({ name: 'PromotionArticle' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  categoryId: undefined,
  title: null,
  status: undefined,
  spuId: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
/** 文章封面预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ArticleApi.getArticlePage(queryParams)
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

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ArticleApi.deleteArticle(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

const categoryList = ref<ArticleCategoryApi.ArticleCategoryVO[]>([])
const spuList = ref<ProductSpuApi.Spu[]>([])
onMounted(async () => {
  await getList()
  // 加载分类、商品列表
  categoryList.value =
    (await ArticleCategoryApi.getSimpleArticleCategoryList()) as ArticleCategoryApi.ArticleCategoryVO[]
  spuList.value = (await ProductSpuApi.getSpuSimpleList()) as ProductSpuApi.Spu[]
})
</script>
