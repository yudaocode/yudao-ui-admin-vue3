<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import echarts from '@/plugins/echarts'
import { debounce } from 'lodash-es'
import { propTypes } from '@/utils/propTypes'
import { PropType } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { isString } from '@/utils/is'
import { useDesign } from '@/hooks/web/useDesign'

import 'echarts/lib/component/markPoint'
import 'echarts/lib/component/markLine'
import 'echarts/lib/component/markArea'

defineOptions({ name: 'EChart' })

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('echart')

const appStore = useAppStore()

const props = defineProps({
  options: {
    type: Object as PropType<EChartsOption>,
    required: true
  },
  width: propTypes.oneOfType([Number, String]).def(''),
  height: propTypes.oneOfType([Number, String]).def('500px'),
  notMerge: propTypes.bool.def(false)
})

const isDark = computed(() => appStore.getIsDark)

const theme = computed(() => {
  const echartTheme: boolean | string = unref(isDark) ? true : 'auto'

  return echartTheme
})

const options = computed(() => {
  return Object.assign(props.options, {
    darkMode: unref(theme)
  })
})

const elRef = ref<ElRef>()

let echartRef: Nullable<echarts.ECharts> = null

const contentEl = ref<Element>()

const styles = computed(() => {
  const width = isString(props.width) ? props.width : `${props.width}px`
  const height = isString(props.height) ? props.height : `${props.height}px`

  return {
    width,
    height
  }
})

/** 是否使用词云：词云扩展按需加载，需在 setOption 之前完成注册 */
const hasWordCloud = (options: EChartsOption) => {
  // 兼容标准配置层级：顶层、baseOption、timeline 的 options、media[].option
  const layers: any[] = [
    options,
    options.baseOption,
    ...(options.options || []),
    ...(options.media || []).map((item) => item?.option)
  ]
  return layers.some((layer) => {
    const series = Array.isArray(layer?.series) ? layer.series : [layer?.series]
    return series.some((item: any) => item?.type === 'wordCloud')
  })
}

// 组件是否已卸载、配置更新序号：等待词云扩展加载期间，以最新配置为准
let isUnmounted = false
let updateId = 0
// 当前实例是否在词云扩展加载之后创建
let wordCloudReady = false

const initChart = async () => {
  if (!unref(elRef) || !props.options) {
    return
  }
  if (hasWordCloud(unref(options))) {
    await import('echarts-wordcloud')
    // 加载期间组件可能已卸载
    if (isUnmounted || !unref(elRef) || echartRef) {
      return
    }
    wordCloudReady = true
  }
  echartRef = echarts.init(unref(elRef) as HTMLElement)
  echartRef?.setOption(unref(options), props.notMerge)
}

// ECharts 实例创建时就固定了已注册的数据处理、视觉阶段，词云扩展加载前创建的实例画不出词云：
// 在首次设置词云配置之前重建实例；合并模式下先还原旧实例已合并的配置
const reinitForWordCloud = () => {
  const oldOption = props.notMerge ? undefined : echartRef?.getOption()
  echartRef?.dispose()
  echartRef = echarts.init(unref(elRef) as HTMLElement)
  wordCloudReady = true
  oldOption && echartRef.setOption(oldOption)
}

watch(
  () => options.value,
  async (options) => {
    if (echartRef) {
      const id = ++updateId
      if (hasWordCloud(options)) {
        await import('echarts-wordcloud')
        // 加载期间组件可能已卸载，或已有更新的配置
        if (isUnmounted || id !== updateId) {
          return
        }
        if (!wordCloudReady) {
          reinitForWordCloud()
        }
      }
      echartRef?.setOption(options, props.notMerge)
      echartRef?.resize()
    }
  },
  {
    deep: true
  }
)

const resizeHandler = debounce(() => {
  if (echartRef) {
    echartRef.resize()
  }
}, 100)

const contentResizeHandler = async (e: TransitionEvent) => {
  if (e.propertyName === 'width') {
    resizeHandler()
  }
}

onMounted(() => {
  initChart()

  window.addEventListener('resize', resizeHandler)

  contentEl.value = document.getElementsByClassName(`${variables.namespace}-layout-content`)[0]
  unref(contentEl) &&
    (unref(contentEl) as Element).addEventListener('transitionend', contentResizeHandler)
})

onBeforeUnmount(() => {
  isUnmounted = true
  window.removeEventListener('resize', resizeHandler)
  unref(contentEl) &&
    (unref(contentEl) as Element).removeEventListener('transitionend', contentResizeHandler)
})

onActivated(() => {
  if (echartRef) {
    echartRef.resize()
  }
})
</script>

<template>
  <div ref="elRef" :class="[$attrs.class, prefixCls]" :style="styles"></div>
</template>
