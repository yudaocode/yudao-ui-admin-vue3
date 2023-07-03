<script lang="ts" setup>
import { ElBacktop } from 'element-plus'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'BackTop' })

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('backtop')
</script>

<template>
  <ElBacktop
    :class="`${prefixCls}-backtop`"
    :target="`.${variables.namespace}-layout-content-scrollbar .${variables.elNamespace}-scrollbar__wrap`"
  />
</template>
