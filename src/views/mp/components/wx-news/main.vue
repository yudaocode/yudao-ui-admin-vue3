<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  【微信消息 - 图文】
  芋道源码：
  ① 代码优化，补充注释，提升阅读性
-->
<template>
  <div class="news-home">
    <div v-for="(article, index) in articles" :key="index" class="news-div">
      <!-- 头条 -->
      <a v-if="index === 0" :href="article.url" target="_blank">
        <div class="news-main">
          <div class="news-content">
            <el-image
              :src="article.picUrl"
              class="material-img"
              style="width: 100%; height: 120px"
            />
            <div class="news-content-title">
              <span>{{ article.title }}</span>
            </div>
          </div>
        </div>
      </a>
      <!-- 二条/三条等等 -->
      <a v-else :href="article.url" target="_blank">
        <div class="news-main-item">
          <div class="news-content-item">
            <div class="news-content-item-title">{{ article.title }}</div>
            <div class="news-content-item-img">
              <img :src="article.picUrl" class="material-img" height="100%" />
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'WxNews' })

const props = withDefaults(
  defineProps<{
    articles: any[] | null
  }>(),
  {
    articles: null
  }
)

defineExpose({
  articles: props.articles
})
</script>

<style lang="scss" scoped>
.news-home {
  width: 100%;
  margin: auto;
  background-color: #fff;
}

.news-main {
  width: 100%;
  margin: auto;
}

.news-content {
  position: relative;
  width: 100%;
  background-color: #acadae;
}

.news-content-title {
  position: absolute;
  bottom: 0;
  left: 0;
  display: inline-block;
  width: 98%;
  padding: 1%;
  font-size: 12px;
  color: #fff;
  white-space: normal;
  background-color: black;
  opacity: 0.65;
  box-sizing: unset !important;
}

.news-main-item {
  padding: 5px 0;
  background-color: #fff;
  border-top: 1px solid #eaeaea;
}

.news-content-item {
  position: relative;
}

.news-content-item-title {
  display: inline-block;
  width: 70%;
  margin-left: 1%;
  font-size: 10px;
  white-space: normal;
}

.news-content-item-img {
  display: inline-block;
  width: 25%;
  margin-right: 1%;
  background-color: #acadae;
}

.material-img {
  width: 100%;
}
</style>
