<template>
  <div :class="`box-content min-h-30px w-full flex flex-row flex-wrap`" ref="containerRef">
    <div
        class="relative box-content flex flex-row flex-wrap overflow-hidden bg-white"
        :style="{
        ...calculateSpace(index),
        ...calculateWidth(),
        borderTopLeftRadius: `${property.borderRadiusTop}px`,
        borderTopRightRadius: `${property.borderRadiusTop}px`,
        borderBottomLeftRadius: `${property.borderRadiusBottom}px`,
        borderBottomRightRadius: `${property.borderRadiusBottom}px`
      }"
        v-for="(spu, index) in spuList"
        :key="index"
    >
      <!-- 角标 -->
      <div v-if="property.badge.show" class="absolute left-0 top-0 z-1 items-center justify-center">
        <el-image fit="cover" :src="property.badge.imgUrl" class="h-26px w-38px"/>
      </div>
      <!-- 商品封面图 -->
      <div
          :class="[
          'h-140px',
          {
            'w-full': property.layoutType !== 'oneColSmallImg',
            'w-140px': property.layoutType === 'oneColSmallImg'
          }
        ]"
      >
        <el-image fit="cover" class="h-full w-full" :src="spu.picUrl"/>
      </div>
      <div
          :class="[
          ' flex flex-col gap-8px p-8px box-border',
          {
            'w-full': property.layoutType !== 'oneColSmallImg',
            'w-[calc(100%-140px-16px)]': property.layoutType === 'oneColSmallImg'
          }
        ]"
      >
        <!-- 商品名称 -->
        <div
            v-if="property.fields.name.show"
            :class="[
            'text-14px ',
            {
              truncate: property.layoutType !== 'oneColSmallImg',
              'overflow-ellipsis line-clamp-2': property.layoutType === 'oneColSmallImg'
            }
          ]"
            :style="{ color: property.fields.name.color }"
        >
          {{ spu.name }}
        </div>
        <!-- 商品简介 -->
        <div
            v-if="property.fields.introduction.show"
            class="truncate text-12px"
            :style="{ color: property.fields.introduction.color }"
        >
          {{ spu.introduction }}
        </div>
        <div>
          <!-- 价格 -->
          <span
              v-if="property.fields.price.show"
              class="text-16px"
              :style="{ color: property.fields.price.color }"
          >
            ￥{{ fenToYuan(spu.price || Infinity) }}
          </span>
          <!-- 市场价 -->
          <span
              v-if="property.fields.marketPrice.show && spu.marketPrice"
              class="ml-4px text-10px line-through"
              :style="{ color: property.fields.marketPrice.color }"
          >￥{{ fenToYuan(spu.marketPrice) }}</span
          >
        </div>
        <div class="text-12px">
          <!-- 销量 -->
          <span
              v-if="property.fields.salesCount.show"
              :style="{ color: property.fields.salesCount.color }"
          >
            已售{{ (spu.salesCount || 0) + (spu.virtualSalesCount || 0) }}件
          </span>
          <!-- 库存 -->
          <span v-if="property.fields.stock.show" :style="{ color: property.fields.stock.color }">
            库存{{ spu.stock || 0 }}
          </span>
        </div>
      </div>
      <!-- 购买按钮 -->
      <div class="absolute bottom-8px right-8px">
        <!-- 文字按钮 -->
        <span
            v-if="property.btnBuy.type === 'text'"
            class="rounded-full p-x-12px p-y-4px text-12px text-white"
            :style="{
            background: `linear-gradient(to right, ${property.btnBuy.bgBeginColor}, ${property.btnBuy.bgEndColor}`
          }"
        >
          {{ property.btnBuy.text }}
        </span>
        <!-- 图片按钮 -->
        <el-image
            v-else
            class="h-28px w-28px rounded-full"
            fit="cover"
            :src="property.btnBuy.imgUrl"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {PromotionCombinationProperty} from './config'
import * as ProductSpuApi from '@/api/mall/product/spu'
import * as CombinationActivityApi from '@/api/mall/promotion/combination/combinationActivity'
import {fenToYuan} from "@/utils";

/** 商品卡片 */
defineOptions({name: 'ProductCard'})
// 定义属性
// 定义属性
const props = defineProps<{ property: PromotionCombinationProperty }>();
// 商品列表
const spuList = ref<ProductSpuApi.Spu[]>([]);
const spuIdList = ref<number[]>([]);
const combinationActivityList = ref<CombinationActivityApi.CombinationActivityVO[]>([]);

watch(
    () => props.property.activityIds,
    async () => {
      try {
        // 新添加的拼团组件，是没有活动ID的
        const activityIds = props.property.activityIds;
        // 检查活动ID的有效性
        if (Array.isArray(activityIds) && activityIds.length > 0 && activityIds.every(item => item != null)) {
          // 获取拼团活动详情列表
          combinationActivityList.value = await CombinationActivityApi.getCombinationActivityDetailList(activityIds);

          // 清空之前的数据，防止有重复
          spuIdList.value = [];
          spuList.value = [];

          // 生成有效的 spuId 列表
          spuIdList.value = combinationActivityList.value
              .map(activity => activity.spuId)
              .filter((spuId): spuId is number => typeof spuId === 'number');

          // 如果有有效的 spuId，调用 API 获取详细信息
          if (spuIdList.value.length > 0) {
            spuList.value = await ProductSpuApi.getSpuDetailList(spuIdList.value);
          } else {
            console.warn('没有用于获取详细信息的有效 spuId。');
          }

          // 更新 SPU 的最低价格
          combinationActivityList.value.forEach(activity => {
            activity.products.forEach(product => {
              const spu = spuList.value.find(spu => spu.id === product.spuId);
              if (spu) {
                spu.price = Math.min(product.combinationPrice || Infinity, spu.price || Infinity);
              }
            });
          });
        }
      } catch (error) {
        console.error('获取拼团活动细节或 SPU 细节时出错:', error);
      }
    },
    {
      immediate: true,
      deep: true
    }
);



/**
 * 计算商品的间距
 * @param index 商品索引
 */
const calculateSpace = (index: number) => {
  // 商品的列数
  const columns = props.property.layoutType === 'twoCol' ? 2 : 1
  // 第一列没有左边距
  const marginLeft = index % columns === 0 ? '0' : props.property.space + 'px'
  // 第一行没有上边距
  const marginTop = index < columns ? '0' : props.property.space + 'px'

  return {marginLeft, marginTop}
}

// 容器
const containerRef = ref()
// 计算商品的宽度
const calculateWidth = () => {
  let width = '100%'
  // 双列时每列的宽度为：（总宽度 - 间距）/ 2
  if (props.property.layoutType === 'twoCol') {
    width = `${(containerRef.value.offsetWidth - props.property.space) / 2}px`
  }
  return {width}
}
</script>

<style scoped lang="scss"></style>
