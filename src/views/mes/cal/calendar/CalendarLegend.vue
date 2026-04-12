<!-- 排班日历 - 配色图例说明 -->
<template>
  <div
    class="flex items-center flex-wrap gap-x-16px gap-y-4px text-12px text-#606266 px-2px py-6px"
  >
    <span class="text-#909399 shrink-0">配色说明：</span>
    <span class="flex items-center gap-4px">
      <span class="legend-dot bg-#95d475"></span>
      白班
    </span>
    <span class="flex items-center gap-4px">
      <span class="legend-dot bg-#f0a020"></span>
      中班（三班倒）
    </span>
    <span class="flex items-center gap-4px">
      <span class="legend-dot bg-#909399"></span>
      中班（两班倒）/ 夜班
    </span>
    <span class="flex items-center gap-4px">
      <span class="legend-dot bg-#f56c6c opacity-60"></span>
      <span class="text-#f56c6c">红色日期</span>
      = 周末
    </span>
    <span class="flex items-center gap-4px">
      <el-tag size="small" effect="dark" type="success" class="!text-11px !h-18px !px-4px"
        >休</el-tag
      >
      = 节假日（不显示排班）
    </span>
  </div>
</template>

<style scoped>
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>
