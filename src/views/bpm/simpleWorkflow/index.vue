<template>
  <SimpleProcessDesigner :model-id="modelId" />
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'

defineOptions({
  name: 'SimpleWorkflowDesignEditor'
})
const { query } = useRoute() // 路由的查询
const modelId = query.modelId as string
</script>
<style lang="scss" scoped></style>
