<template>
  <div class="product-warp" style="cursor: pointer" @click.stop="openDetail(spuId)">
    <!-- 左侧商品图片-->
    <div class="product-warp-left mr-24px">
      <el-image
        :initial-index="0"
        :preview-src-list="[picUrl]"
        :src="picUrl"
        class="product-warp-left-img"
        fit="contain"
        preview-teleported
        @click.stop
      />
    </div>
    <!-- 右侧商品信息 -->
    <div class="product-warp-right">
      <div class="description">{{ title }}</div>
      <div class="my-5px">
        <span class="mr-20px">库存: {{ stock || 0 }}</span>
        <span>销量: {{ salesCount || 0 }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="price">￥{{ fenToYuan(price) }}</span>
        <el-button size="small" text type="primary">详情</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { fenToYuan } from '@/utils'

const { push } = useRouter()

defineOptions({ name: 'ProductItem' })
defineProps({
  spuId: {
    type: Number,
    default: 0
  },
  picUrl: {
    type: String,
    default: 'https://img1.baidu.com/it/u=1601695551,235775011&fm=26&fmt=auto'
  },
  title: {
    type: String,
    default: ''
  },
  price: {
    type: [String, Number],
    default: ''
  },
  salesCount: {
    type: [String, Number],
    default: ''
  },
  stock: {
    type: [String, Number],
    default: ''
  }
})

/** 查看商品详情 */
const openDetail = (spuId: number) => {
  push({ name: 'ProductSpuDetail', params: { id: spuId } })
}
</script>

<style lang="scss" scoped>
.button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.product-warp {
  width: 100%;
  background-color: rgba(128, 128, 128, 0.3);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 10px;

  &-left {
    width: 70px;

    &-img {
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  }

  &-right {
    flex: 1;

    .description {
      width: 100%;
      font-size: 16px;
      font-weight: bold;
      display: -webkit-box;
      -webkit-line-clamp: 1; /* 显示一行 */
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price {
      color: #ff3000;
    }
  }
}
</style>
