<template>
  <el-descriptions :column="2">
    <!-- TODO @梦：要不 icon 也给加下？ -->
    <!-- TODO @梦：积分、成长值、等级，已经可以读取了，可以看下 -->
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 等级 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 成长值 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 当前积分 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 总积分 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 当前余额 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 支出金额 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 充值金额 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
  </el-descriptions>
</template>
<script lang="ts" setup>
defineComponent({
  name: 'AccountInfo'
})
</script>
<style scoped lang="scss">
.cell-item {
  display: inline;
}
.cell-item::after {
  content: ':';
}
</style>
