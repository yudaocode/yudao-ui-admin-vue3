<template>
  <div class="gallery">
    <div v-for="item in publicList" :key="item" class="gallery-item">
      <img :src="item.picUrl" class="img"/>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ImageApi, ImageVO, ImageMidjourneyButtonsVO } from '@/api/ai/image'

/** 属性 */
const pageNo = ref<number>(1)
const pageSize = ref<number>(20)
const publicList = ref<ImageVO[]>([])

/** 获取数据 */
const getListData = async () => {
  const res = await ImageApi.getImagePagePublic({pageNo: pageNo.value, pageSize: pageSize.value});
  publicList.value = res.list as ImageVO[];
  console.log('publicList.value', publicList.value)
}

onMounted(async () => {
  await getListData()
})
</script>
<style scoped lang="scss">

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  //max-width: 1000px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
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

</style>
