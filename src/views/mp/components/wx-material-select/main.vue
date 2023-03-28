<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除 avue 组件，使用 ElementUI 原生组件
-->
<template>
  <!-- 类型：图片 -->
  <div v-if="objData.type === 'image'">
    <div class="waterfall" v-loading="loading">
      <div class="waterfall-item" v-for="item in list" :key="item.mediaId">
        <img class="material-img" :src="item.url" />
        <p class="item-name">{{ item.name }}</p>
        <el-row class="ope-row">
          <el-button type="success" @click="selectMaterialFun(item)"
            >选择
            <i class="el-icon-circle-check el-icon--right"></i>
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
      @pagination="getMaterialPageFun"
    />
  </div>
  <!-- 类型：语音 -->
  <div v-else-if="objData.type === 'voice'">
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="mediaId" />
      <el-table-column label="文件名" align="center" prop="name" />
      <el-table-column label="语音" align="center">
        <template #default="scope">
          <wx-voice-player :url="scope.row.url" />
        </template>
      </el-table-column>
      <el-table-column label="上传时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        fixed="right"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button type="text" icon="el-icon-circle-plus" @click="selectMaterialFun(scope.row)"
            >选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getPage"
    />
  </div>
  <div v-else-if="objData.type === 'video'">
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="mediaId" />
      <el-table-column label="文件名" align="center" prop="name" />
      <el-table-column label="标题" align="center" prop="title" />
      <el-table-column label="介绍" align="center" prop="introduction" />
      <el-table-column label="视频" align="center">
        <template #default="scope">
          <wx-video-player :url="scope.row.url" />
        </template>
      </el-table-column>
      <el-table-column label="上传时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        fixed="right"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button type="text" icon="el-icon-circle-plus" @click="selectMaterialFun(scope.row)"
            >选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getMaterialPageFun"
    />
  </div>
  <div v-else-if="objData.type === 'news'">
    <div class="waterfall" v-loading="loading">
      <div class="waterfall-item" v-for="item in list" :key="item.mediaId">
        <div v-if="item.content && item.content.newsItem">
          <wx-news :articles="item.content.newsItem" />
          <el-row class="ope-row">
            <el-button type="success" @click="selectMaterialFun(item)">
              选择<i class="el-icon-circle-check el-icon--right"></i>
            </el-button>
          </el-row>
        </div>
      </div>
    </div>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getMaterialPageFun"
    />
  </div>
</template>

<script lang="ts" name="WxMaterialSelect">
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import { getMaterialPage } from '@/api/mp/material'
import { getFreePublishPage } from '@/api/mp/freePublish'
import { getDraftPage } from '@/api/mp/draft'
import { dateFormatter, parseTime } from '@/utils/formatTime'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  components: {
    WxNews,
    WxVoicePlayer,
    WxVideoPlayer
  },
  props: {
    objData: {
      type: Object, // type - 类型；accountId - 公众号账号编号
      required: true
    },
    newsType: {
      // 图文类型：1、已发布图文；2、草稿箱图文
      type: String as PropType<string>,
      default: '1'
    }
  },
  setup(props, ctx) {
    // 遮罩层
    const loading = ref(false)
    // 总条数
    const total = ref(0)
    // 数据列表
    const list = ref([])
    // 查询参数
    const queryParams = reactive({
      pageNo: 1,
      pageSize: 10,
      accountId: props.objData.accountId
    })
    const objDataRef = reactive(props.objData)
    const newsTypeRef = ref(props.newsType)

    const selectMaterialFun = (item) => {
      ctx.emit('selectMaterial', item)
    }
    /** 搜索按钮操作 */
    const handleQuery = () => {
      queryParams.pageNo = 1
      getPage()
    }
    const getPage = () => {
      loading.value = true
      if (objDataRef.type === 'news' && newsTypeRef.value === '1') {
        // 【图文】+ 【已发布】
        getFreePublishPageFun()
      } else if (objDataRef.type === 'news' && newsTypeRef.value === '2') {
        // 【图文】+ 【草稿】
        getDraftPageFun()
      } else {
        // 【素材】
        getMaterialPageFun()
      }
    }

    const getMaterialPageFun = async () => {
      let data = await getMaterialPage({
        ...queryParams,
        type: objDataRef.type
      })
      list.value = data.list
      total.value = data.total
      loading.value = false
    }
    const getFreePublishPageFun = async () => {
      let data = await getFreePublishPage(queryParams)
      data.list.foreach((item) => {
        const newsItem = item.content.newsItem
        newsItem.forEach((article) => {
          article.picUrl = article.thumbUrl
        })
      })
      list.value = data.list
      total.value = data.total
      loading.value = false
    }

    const getDraftPageFun = async () => {
      let data = await getDraftPage(queryParams)
      data.list.forEach((item) => {
        const newsItem = item.content.newsItem
        newsItem.forEach((article) => {
          article.picUrl = article.thumbUrl
        })
      })
      list.value = data.list
      total.value = data.total
      loading.value = false
    }

    onMounted(async () => {
      getPage()
    })
    return {
      handleQuery,
      dateFormatter,
      selectMaterialFun,
      getMaterialPageFun,
      getPage,
      parseTime,
      newsTypeRef,
      queryParams,
      objDataRef,
      list,
      total,
      loading
    }
  }
})
</script>

<style lang="scss" scoped>
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

.material-img {
  width: 100%;
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
</style>
