<template>
  <div class="square-container">
    <el-input
      v-model="searchText"
      style="width: 100%; margin-bottom: 20px"
      size="large"
      placeholder="请输入要搜索的内容"
      :suffix-icon="Search"
      @keyup.enter="handleSearch"
    />
    <div class="gallery">
      <div v-for="item in publicList" :key="item.id" class="gallery-item">
        <img :src="item.picUrl" class="img" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import { Search } from '@element-plus/icons-vue'

/** 属性 */
// TODO @fan：queryParams 里面搞分页哈。
const pageNo = ref<number>(1)
const pageSize = ref<number>(20)
const publicList = ref<ImageVO[]>([])
const searchText = ref<string>('')

/** 获取数据 */
const getListData = async () => {
  const res = await ImageApi.getImagePagePublic({
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    prompt: searchText.value
  })
  publicList.value = res.list as ImageVO[]
}

/** 搜索 */
const handleSearch = async () => {
  await getListData()
}

onMounted(async () => {
  await getListData()
})
</script>
<style scoped lang="scss">
.square-container {
  background-color: #fff;
  padding: 20px;

  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    //max-width: 1000px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .gallery-item {
    position: relative;
    overflow: hidden;
    background: #f0f0f0;
    cursor: pointer;
    transition: transform 0.3s;
  }

  .gallery-item img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.3s;
  }

  .gallery-item:hover img {
    transform: scale(1.1);
  }

  .gallery-item:hover {
    transform: scale(1.05);
  }
}
</style>
