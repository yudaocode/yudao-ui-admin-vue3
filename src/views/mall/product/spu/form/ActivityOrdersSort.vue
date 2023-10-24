<template>
  <div ref="elTagWrappingRef">
    <template v-if="activityOrders && activityOrders.length > 0">
      <el-tag
        v-for="activityType in activityOrders"
        :key="activityType"
        :type="promotionTypes.find((item) => item.value === activityType)?.colorType"
        class="mr-[10px]"
      >
        {{ promotionTypes.find((item) => item.value === activityType)?.label }}
      </el-tag>
    </template>
    <template v-else>
      <el-tag
        v-for="type in promotionTypes"
        :key="type.value as number"
        :type="type.colorType"
        class="mr-[10px]"
      >
        {{ type.label }}
      </el-tag>
    </template>
  </div>
</template>
<script lang="ts" setup>
import Sortable from 'sortablejs'
import type { DictDataType } from '@/utils/dict'

defineOptions({ name: 'ActivityOrdersSort' })
const props = defineProps<{
  promotionTypes: DictDataType[]
  activityOrders: number[]
}>()
const emit = defineEmits<{
  (e: 'update:activityOrders', v: number[])
}>()
const elTagWrappingRef = ref() // elTag 容器 Ref

const initSortable = () => {
  new Sortable(elTagWrappingRef.value, {
    swapThreshold: 1,
    animation: 150,
    onEnd: (el) => {
      const innerText = el.to.innerText
      // 将字符串按换行符分割成数组
      const activityOrder = innerText.split('\n')
      // 根据字符串中的顺序重新排序数组
      const sortedActivityOrder = activityOrder.map((activityName) => {
        return props.promotionTypes.find((item) => item.label === activityName)?.value
      })
      emit('update:activityOrders', sortedActivityOrder as number[])
    }
  })
}
onMounted(async () => {
  await nextTick()
  // 如果活动排序为空也就是新增的时候加入活动
  if (props.activityOrders && props.activityOrders.length === 0) {
    emit(
      'update:activityOrders',
      props.promotionTypes.map((item) => item.value as number)
    )
  }
  initSortable()
})
</script>
