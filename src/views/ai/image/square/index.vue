<template>
  <div class="bg-white p-20px">
    <!-- TODO @fan：style 建议换成 unocss -->
    <!-- TODO @fan：Search 可以换成 Icon 组件么？ -->
    <el-input
      v-model="queryParams.prompt"
      class="!w-full !mb-20px"
      size="large"
      placeholder="请输入要搜索的内容"
      :suffix-icon="Search"
      @keyup.enter="handleQuery"
    />
    <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-10px bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <!-- TODO @fan：这个图片的风格，要不和 ImageCard.vue 界面一致？（只有卡片，没有操作）；因为看着更有相框的感觉~~~ -->
      <div v-for="item in list" :key="item.id" class="relative overflow-hidden bg-gray-100 cursor-pointer transition-transform duration-300 hover:scale-105">
        <img :src="item.picUrl" class="w-full h-auto block transition-transform duration-300 hover:scale-110" />
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

