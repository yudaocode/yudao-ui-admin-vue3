<template>
  <!-- 商品概览 -->
  <ProductSummary />
  <!-- 商品排行 -->
  <ProductRank class="mt-16px" />
</template>
<script lang="ts" setup>
import ProductSummary from './components/ProductSummary.vue'
import ProductRank from './components/ProductRank.vue'

/** 商品统计 */
defineOptions({ name: 'ProductStatistics' })
</script>
<style lang="scss" scoped></style>
