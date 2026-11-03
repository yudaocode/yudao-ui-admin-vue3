<script lang="ts" setup>
import { ElBacktop } from 'element-plus'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'BackTop' })

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('backtop')
</script>

<template>
  <!-- 根类名与上游一致为 prefixCls；保留原 `${prefixCls}-backtop` 类名，兼容已有自定义样式 -->
  <ElBacktop
    :class="[prefixCls, `${prefixCls}-backtop`]"
    :target="`.${variables.namespace}-layout-content-scrollbar .${variables.elNamespace}-scrollbar__wrap`"
  />
</template>
