<template>
  <div class="square-container">
    <!-- TODO @fan：style 建议换成 unocss -->
    <!-- TODO @fan：Search 可以换成 Icon 组件么？ -->
    <el-input
      v-model="queryParams.prompt"
      style="width: 100%; margin-bottom: 20px"
      size="large"
      placeholder="请输入要搜索的内容"
      :suffix-icon="Search"
      @keyup.enter="handleQuery"
    />
    <div class="gallery">
      <!-- TODO @fan：这个图片的风格，要不和 ImageCard.vue 界面一致？（只有卡片，没有操作）；因为看着更有相框的感觉~~~ -->
      <div v-for="item in list" :key="item.id" class="gallery-item">
        <img :src="item.picUrl" class="img" />
      </div>
    </div>
    <!-- TODO @fan：缺少翻页 -->
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>
<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import { Search } from '@element-plus/icons-vue'

// TODO @fan：加个 loading 加载中的状态
const loading = ref(true) // 列表的加载中
const list = ref<ImageVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  publicStatus: true,
  prompt: undefined
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ImageApi.getImagePageMy(queryParams)
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

/** 初始化 */
onMounted(async () => {
  await getList()
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
