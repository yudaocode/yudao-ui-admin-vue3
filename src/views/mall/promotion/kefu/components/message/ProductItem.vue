<template>
  <div>
    <div>
      <slot name="top"></slot>
    </div>
    <div
      :style="[{ borderRadius: radius + 'px', marginBottom: marginBottom + 'px' }]"
      class="ss-order-card-warp flex items-stretch justify-between bg-white"
    >
      <div class="img-box mr-24px">
        <el-image
          :initial-index="0"
          :preview-src-list="[picUrl]"
          :src="picUrl"
          class="order-img"
          fit="contain"
          preview-teleported
        />
      </div>
      <div
        :style="[{ width: titleWidth ? titleWidth + 'px' : '' }]"
        class="box-right flex flex-col justify-between"
      >
        <div v-if="title" class="title-text ss-line-2">{{ title }}</div>
        <div v-if="skuString" class="spec-text mt-8px mb-12px">{{ skuString }}</div>
        <div class="groupon-box">
          <slot name="groupon"></slot>
        </div>
        <div class="flex">
          <div class="flex items-center">
            <div
              v-if="price && Number(price) > 0"
              :style="[{ color: priceColor }]"
              class="price-text flex items-center"
            >
              ￥{{ fenToYuan(price) }}
            </div>
            <div v-if="num" class="total-text flex items-center">x {{ num }}</div>
            <slot name="priceSuffix"></slot>
          </div>
        </div>
        <div class="tool-box">
          <slot name="tool"></slot>
        </div>
        <div>
          <slot name="rightBottom"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { fenToYuan } from '@/utils'

defineOptions({ name: 'ProductItem' })
const props = defineProps({
  picUrl: {
    type: String,
    default: 'https://img1.baidu.com/it/u=1601695551,235775011&fm=26&fmt=auto'
  },
  title: {
    type: String,
    default: ''
  },
  titleWidth: {
    type: Number,
    default: 0
  },
  skuText: {
    type: [String, Array],
    default: ''
  },
  price: {
    type: [String, Number],
    default: ''
  },
  priceColor: {
    type: [String],
    default: ''
  },
  num: {
    type: [String, Number],
    default: 0
  },
  score: {
    type: [String, Number],
    default: ''
  },
  radius: {
    type: [String],
    default: ''
  },
  marginBottom: {
    type: [String],
    default: ''
  }
})

/** SKU 展示字符串 */
const skuString = computed(() => {
  if (!props.skuText) {
    return ''
  }
  if (typeof props.skuText === 'object') {
    return props.skuText.join(',')
  }
  return props.skuText
})
</script>

<style lang="scss" scoped>
.ss-order-card-warp {
  padding: 20px;
  border-radius: 10px;
  background-color: #e2e2e2;

  .img-box {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    overflow: hidden;

    .order-img {
      width: 80px;
      height: 80px;
    }
  }

  .box-right {
    flex: 1;
    position: relative;

    .tool-box {
      position: absolute;
      right: 0px;
      bottom: -10px;
    }
  }

  .title-text {
    font-size: 16px;
    font-weight: 500;
    line-height: 20px;
  }

  .spec-text {
    font-size: 16px;
    font-weight: 400;
    color: #999999;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .price-text {
    font-size: 16px;
    font-weight: 500;
    font-family: OPPOSANS;
  }

  .total-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 16px;
    color: #999999;
    margin-left: 8px;
  }
}

.ss-line {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;

  &-1 {
    -webkit-line-clamp: 1;
  }

  &-2 {
    -webkit-line-clamp: 2;
  }
}
</style>
