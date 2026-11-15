<script lang="ts" setup>
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ContentWrap' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('content-wrap')

withDefaults(
  defineProps<{
    title?: string
    message?: string
    bodyStyle?: Record<string, any>
  }>(),
  {
    title: '',
    message: '',
    // 每个实例返回新的默认对象（与原 propTypes.object.def 的拷贝工厂一致）；默认内边距保持 10px
    bodyStyle: () => ({ padding: '10px', overflow: 'hidden' })
  }
)
</script>

<template>
  <ElCard :body-style="bodyStyle" :class="[prefixCls, 'mb-15px']" shadow="never">
    <template v-if="title" #header>
      <div class="flex items-center">
        <span class="text-16px font-700">{{ title }}</span>
        <ElTooltip v-if="message" effect="dark" placement="right">
          <template #content>
            <div class="max-w-200px">{{ message }}</div>
          </template>
          <Icon :size="14" class="ml-5px" icon="ep:question-filled" />
        </ElTooltip>
        <div class="flex flex-grow pl-20px">
          <slot name="header"></slot>
        </div>
      </div>
    </template>
    <slot></slot>
  </ElCard>
</template>
