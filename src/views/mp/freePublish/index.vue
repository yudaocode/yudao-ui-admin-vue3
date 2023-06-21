<template>
  <doc-alert title="公众号图文" url="https://doc.iocoder.cn/mp/article/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="公众号" prop="accountId">
        <WxAccountSelect @change="onAccountChanged" />
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div class="waterfall" v-loading="loading">
      <div
        class="waterfall-item"
        v-show="item.content && item.content.newsItem"
        v-for="item in list"
        :key="item.articleId"
      >
        <wx-news :articles="item.content.newsItem" />
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
import * as FreePublishApi from '@/api/mp/freePublish'
import WxNews from '@/views/mp/components/wx-news'
import WxAccountSelect from '@/views/mp/components/wx-account-select'

defineOptions({ name: 'MpFreePublish' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: -1
})

/** 侦听公众号变化 **/
const onAccountChanged = (id: number) => {
  queryParams.accountId = id
  queryParams.pageNo = 1
  getList()
}

/** 查询列表 */
const getList = async () => {
  try {
    loading.value = true
    const data = await FreePublishApi.getFreePublishPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (item: any) => {
  try {
    // 删除的二次确认
    await message.delConfirm('删除后用户将无法访问此页面，确定删除？')
    // 发起删除
    await FreePublishApi.deleteFreePublish(queryParams.accountId, item.articleId)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}
</script>
<style lang="scss" scoped>
@media (width >= 992px) and (width <= 1300px) {
  .waterfall {
    column-count: 3;
  }

  p {
    color: red;
  }
}

@media (width >= 768px) and (width <= 991px) {
  .waterfall {
    column-count: 2;
  }

  p {
    color: orange;
  }
}

@media (width <= 767px) {
  .waterfall {
    column-count: 1;
  }
}

.ope-row {
  padding-top: 5px;
  margin-top: 5px;
  text-align: center;
  border-top: 1px solid #eaeaea;
}

.item-name {
  overflow: hidden;
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-upload__tip {
  margin-left: 5px;
}

/* 新增图文 */
.left {
  display: inline-block;
  width: 35%;
  margin-top: 200px;
  vertical-align: top;
}

.right {
  display: inline-block;
  width: 60%;
  margin-top: -40px;
}

.avatar-uploader {
  display: inline-block;
  width: 20%;
}

.avatar-uploader .el-upload {
  position: relative;
  overflow: hidden;
  text-align: unset !important;
  cursor: pointer;
  border-radius: 6px;
}

.avatar-uploader .el-upload:hover {
  border-color: #165dff;
}

.avatar-uploader-icon {
  width: 120px;
  height: 120px;
  font-size: 28px;
  line-height: 120px;
  color: #8c939d;
  text-align: center;
  border: 1px solid #d9d9d9;
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
  display: inline-block;
  width: 60%;
  vertical-align: top;
}

/* 新增图文 */

/* 瀑布流样式 */
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

/* 瀑布流样式 */
.news-main {
  width: 100%;
  height: 120px;
  margin: auto;
  background-color: #fff;
}

.news-content {
  position: relative;
  width: 100%;
  height: 120px;
  background-color: #acadae;
}

.news-content-title {
  position: absolute;
  bottom: 0;
  left: 0;
  display: inline-block;
  width: 98%;
  height: 25px;
  padding: 1%;
  overflow: hidden;
  font-size: 15px;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: black;
  opacity: 0.65;
}

.news-main-item {
  width: 100%;
  padding: 5px 0;
  margin: auto;
  background-color: #fff;
  border-top: 1px solid #eaeaea;
}

.news-content-item {
  position: relative;
  margin-left: -3px;
}

.news-content-item-title {
  display: inline-block;
  width: 70%;
  font-size: 12px;
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
  height: 50px;
  margin: auto;
  text-align: center;
}

.icon-plus {
  margin: 10px;
  font-size: 25px;
}

.select-item {
  width: 60%;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;
}

.father .child {
  position: relative;
  bottom: 25px;
  display: none;
  text-align: center;
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
