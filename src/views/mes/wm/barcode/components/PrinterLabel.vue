<template>
  <el-button type="primary" link @click="handlePrint">
    {{ labelText }}
  </el-button>
</template>
<script lang="ts" setup>
// TODO @芋艿：后续实现。对接 HiPrint 打印插件 + UReport 报表模板，实现标签打印功能

defineOptions({ name: 'PrinterLabel' })

defineProps({
  bizId: { type: Number, default: undefined }, // 业务实体 ID
  bizCode: { type: String, default: undefined }, // 业务实体编码
  bizType: { type: String, default: undefined }, // 业务类型（如 ITEM、BATCH、PROCARD 等）
  labelText: { type: String, default: '标签打印' } // 按钮文字
})

/** 打印 */
const handlePrint = () => {
  ElMessage.warning('标签打印功能暂未实现，敬请期待')
}
</script>
