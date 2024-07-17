<template>
  <div class="card-list">
    <div v-for="item in publicList" :key="item.id" class="card">
      <img :src="item.picUrl" class="img" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'

/** 属性 */
// TODO @fan：queryParams 里面搞分页哈。
const pageNo = ref<number>(1)
const pageSize = ref<number>(20)
const publicList = ref<ImageVO[]>([])

/** 获取数据 */
const getListData = async () => {
  const res = await ImageApi.getImagePagePublic({ pageNo: pageNo.value, pageSize: pageSize.value })
  publicList.value = res.list as ImageVO[]
  console.log('publicList.value', publicList.value)
}

onMounted(async () => {
  await getListData()
})
</script>
<style scoped lang="scss">
.card-list {
  //display: flex;
  //flex-direction: column;
  column-count: 4;
  column-gap: 3px;
}

.card {
  .img {
    width: 50%;
  }
}
</style>
