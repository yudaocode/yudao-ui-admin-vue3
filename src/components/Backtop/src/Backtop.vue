<script lang="ts" setup>
import { ElBacktop } from 'element-plus'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'BackTop' })

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('backtop')
</script>

<template>
  <!-- 滚动目标与上游一致；去掉无人引用的遗留 `${prefixCls}-backtop` 类名（上游 ac186be70 起不再附加组件类名），保留根类名 prefixCls -->
  <ElBacktop
    :class="prefixCls"
    :target="`.${variables.namespace}-layout-content-scrollbar .${variables.elNamespace}-scrollbar__wrap`"
  />
</template>
