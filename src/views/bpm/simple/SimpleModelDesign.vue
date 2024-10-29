<template>
  <ContentWrap :bodyStyle="{ padding: '20px 16px' }">
    <SimpleProcessDesigner :model-id="modelId" @success="close" />
  </ContentWrap>
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'

defineOptions({
  name: 'SimpleModelDesign'
})
const router = useRouter() // 路由
const { query } = useRoute() // 路由的查询
const modelId = query.modelId as string
const close = () => {
  router.push({ path: '/bpm/manager/model' })
}
</script>
<style lang="scss" scoped></style>
