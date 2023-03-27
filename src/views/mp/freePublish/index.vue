<template>
  <!-- 搜索工作栏 -->
  <content-wrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="公众号" prop="accountId">
        <el-select v-model="queryParams.accountId" placeholder="请选择公众号" class="!w-240px">
          <el-option
            v-for="item in accountList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <div class="waterfall" v-loading="loading">
      <div
        class="waterfall-item"
        v-show="item.content && item.content.newsItem"
        v-for="item in list"
        :key="item.articleId"
      >
        <wx-news :articles="item.content.newsItem" />
        <!-- 操作 -->
        <el-row justify="center" class="ope-row">
          <el-button
            type="danger"
            circle
            @click="handleDelete(item)"
            v-hasPermi="['mp:free-publish:delete']"
          >
            <Icon icon="ep:delete" />
          </el-button>
        </el-row>
      </div>
    </div>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </content-wrap>
</template>

<script setup lang="ts" name="freePublish">
import { getFreePublishPage, deleteFreePublish } from '@/api/mp/freePublish'
import * as MpAccountApi from '@/api/mp/account'
import WxNews from '@/views/mp/components/wx-news/main.vue'
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  currentPage: 1, // 当前页数
  pageNo: 1, // 当前页数
  accountId: undefined // 当前页数
})
const queryFormRef = ref() // 搜索的表单
const accountList = ref<MpAccountApi.AccountVO[]>([]) // 公众号账号列表

/** 查询列表 */
const getList = async () => {
  // 如果没有选中公众号账号，则进行提示。
  if (!queryParams.accountId) {
    message.error('未选中公众号，无法查询已发表图文')
    return false
  }
  // TODO 改成 await 形式
  loading.value = true
  getFreePublishPage(queryParams)
    .then((data) => {
      console.log(data)
      // 将 thumbUrl 转成 picUrl，保证 wx-news 组件可以预览封面
      data.list.forEach((item) => {
        console.log(item)
        const newsItem = item.content.newsItem
        newsItem.forEach((article) => {
          article.picUrl = article.thumbUrl
        })
      })
      list.value = data.list
      total.value = data.total
    })
    .finally(() => {
      loading.value = false
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
  // 默认选中第一个
  if (accountList.value.length > 0) {
    // @ts-ignore
    queryParams.accountId = accountList.value[0].id
  }
  handleQuery()
}

/** 删除按钮操作 */
const handleDelete = async (item) => {
  {
    // TODO 改成 await 形式
    const articleId = item.articleId
    const accountId = queryParams.accountId
    message
      .confirm('删除后用户将无法访问此页面，确定删除？')
      .then(function () {
        return deleteFreePublish(accountId, articleId)
      })
      .then(() => {
        getList()
        message.success('删除成功')
      })
      .catch(() => {})
  }
}

onMounted(async () => {
  accountList.value = await MpAccountApi.getSimpleAccountList()
  // 选中第一个
  if (accountList.value.length > 0) {
    // @ts-ignore
    queryParams.accountId = accountList.value[0].id
  }
  await getList()
})
</script>
<style lang="scss" scoped>
.pagination {
  float: right;
  margin-right: 25px;
}

.add_but {
  padding: 10px;
}

.ope-row {
  margin-top: 5px;
  text-align: center;
  border-top: 1px solid #eaeaea;
  padding-top: 5px;
}

.item-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.el-upload__tip {
  margin-left: 5px;
}

/* 新增图文 */
.left {
  display: inline-block;
  width: 35%;
  vertical-align: top;
  margin-top: 200px;
}

.right {
  display: inline-block;
  width: 60%;
  margin-top: -40px;
}

.avatar-uploader {
  width: 20%;
  display: inline-block;
}

.avatar-uploader .el-upload {
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-align: unset !important;
}

.avatar-uploader .el-upload:hover {
  border-color: #165dff;
}

.avatar-uploader-icon {
  border: 1px solid #d9d9d9;
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 230px;
  height: 120px;
}

.avatar1 {
  width: 120px;
  height: 120px;
}

.digest {
  width: 60%;
  display: inline-block;
  vertical-align: top;
}

/*新增图文*/
/*瀑布流样式*/
.waterfall {
  width: 100%;
  column-gap: 10px;
  column-count: 5;
  margin: 0 auto;
}

.waterfall-item {
  padding: 10px;
  margin-bottom: 10px;
  break-inside: avoid;
  border: 1px solid #eaeaea;
}

p {
  line-height: 30px;
}

@media (min-width: 992px) and (max-width: 1300px) {
  .waterfall {
    column-count: 3;
  }
  p {
    color: red;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .waterfall {
    column-count: 2;
  }
  p {
    color: orange;
  }
}

@media (max-width: 767px) {
  .waterfall {
    column-count: 1;
  }
}

/*瀑布流样式*/
.news-main {
  background-color: #ffffff;
  width: 100%;
  margin: auto;
  height: 120px;
}

.news-content {
  background-color: #acadae;
  width: 100%;
  height: 120px;
  position: relative;
}

.news-content-title {
  display: inline-block;
  font-size: 15px;
  color: #ffffff;
  position: absolute;
  left: 0px;
  bottom: 0px;
  background-color: black;
  width: 98%;
  padding: 1%;
  opacity: 0.65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 25px;
}

.news-main-item {
  background-color: #ffffff;
  padding: 5px 0px;
  border-top: 1px solid #eaeaea;
  width: 100%;
  margin: auto;
}

.news-content-item {
  position: relative;
  margin-left: -3px;
}

.news-content-item-title {
  display: inline-block;
  font-size: 12px;
  width: 70%;
}

.news-content-item-img {
  display: inline-block;
  width: 25%;
  background-color: #acadae;
}

.input-tt {
  padding: 5px;
}

.activeAddNews {
  border: 5px solid #2bb673;
}

.news-main-plus {
  width: 280px;
  text-align: center;
  margin: auto;
  height: 50px;
}

.icon-plus {
  margin: 10px;
  font-size: 25px;
}

.select-item {
  width: 60%;
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.father .child {
  display: none;
  text-align: center;
  position: relative;
  bottom: 25px;
}

.father:hover .child {
  display: block;
}

.thumb-div {
  display: inline-block;
  width: 30%;
  text-align: center;
}

.thumb-but {
  margin: 5px;
}

.material-img {
  width: 100%;
  height: 100%;
}
</style>
