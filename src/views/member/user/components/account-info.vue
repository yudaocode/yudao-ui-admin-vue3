<template>
  <el-descriptions :column="2">
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 储值余额 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 现金余额 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 积分 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item"> 成长值 </div>
      </template>
      {{ 0 }}
    </el-descriptions-item>
  </el-descriptions>
</template>
<script lang="ts" setup>
import { defineComponent } from 'vue'

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
