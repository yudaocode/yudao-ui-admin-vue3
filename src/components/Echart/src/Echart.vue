<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import echarts from '@/plugins/echarts'
import { debounce } from 'lodash-es'
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

// props 使用 withDefaults + 类型声明；接口保持芋道 options / width / height / notMerge
const props = withDefaults(
  defineProps<{
    options: EChartsOption
    // 默认铺满容器，flex 等父容器中不会因无内容而宽度为 0
    width?: number | string
    // 默认高度 300，数字按 px 处理
    height?: number | string
    // 默认整体替换配置（notMerge=true），配置更新时图例选中、区域缩放等交互状态重置为配置初值；
    // 显式传 false 时按 ECharts 普通合并，保留已有组件与交互状态
    notMerge?: boolean
  }>(),
  { width: '100%', height: 300, notMerge: true }
)

const isDark = computed(() => appStore.getIsDark)

const theme = computed(() => {
  const echartTheme: boolean | string = unref(isDark) ? true : 'auto'

  return echartTheme
})

// ECharts 内置主题：暗色 'dark'、浅色 'default'
const echartThemeName = computed(() => (unref(isDark) ? 'dark' : 'default'))

// 浅拷贝后再设置 darkMode，不原地修改父组件传入的 options
// 背景默认透明，调用方设置了背景时以调用方为准
const options = computed(() => {
  const option = {
    ...props.options,
    darkMode: unref(theme)
  } as EChartsOption
  if (option.backgroundColor === undefined) {
    option.backgroundColor = 'transparent'
  }
  return option
})

const elRef = ref<ElRef>()

let echartRef: Nullable<echarts.ECharts> = null

const contentEl = ref<Element>()

// 观察图表容器自身尺寸
let resizeObserver: ResizeObserver | undefined

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
// 当前实例使用的 ECharts 主题
let chartThemeName: string | undefined

// 本组件传给 ECharts 的配置累计结果（未补默认值与主题样式）：ECharts setTheme 只按首次 setOption 的配置重建，
// 之后合并进来的系列、坐标轴等会丢失，切换主题时据此重建。timeline、media 与 ECharts 一样整体替换
interface MergedOption {
  base: Recordable
  timeline?: any[]
  media?: any[]
}
let mergedOption: MergedOption | undefined

const { clone, merge } = echarts.util

const toOptionList = (value: any): any[] => {
  if (value == null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

// 与 ECharts 一致：id、name 只按字符串或数字比较
const toOptionKey = (value: any) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : undefined

// 同一类组件的合并，映射规则与 ECharts 普通合并相同：先按 id；再按 name（新配置未指定 id）；
// 其余按顺序放入第一个未匹配的已有组件，指定了 id 却未匹配的新配置追加在末尾
const mergeComponentOptions = (existing: any[], incoming: any[]) => {
  const result = existing.slice()
  const matched: boolean[] = []
  const pending = incoming.filter((item) => item !== null && typeof item === 'object')
  const findUnmatched = (predicate: (item: any) => boolean) =>
    result.findIndex((item, index) => !matched[index] && predicate(item))
  const assign = (index: number, item: Recordable) => {
    const target = result[index]
    // 子类型（如系列 type）改变时 ECharts 新建组件，不保留旧配置
    const sameType = item.type == null || target?.type == null || item.type === target.type
    result[index] = target && sameType ? merge(target, item, true) : clone(item)
    matched[index] = true
  }
  const mapBy = (findIndex: (item: Recordable) => number) => {
    for (let i = 0; i < pending.length; i++) {
      const index = findIndex(pending[i])
      if (index >= 0) {
        assign(index, pending[i])
        pending.splice(i--, 1)
      }
    }
  }
  mapBy((item) => {
    const id = toOptionKey(item.id)
    return id === undefined ? -1 : findUnmatched((cur) => toOptionKey(cur?.id) === id)
  })
  mapBy((item) => {
    const name = toOptionKey(item.name)
    if (name === undefined || toOptionKey(item.id) !== undefined) {
      return -1
    }
    return findUnmatched((cur) => toOptionKey(cur?.name) === name)
  })
  pending.forEach((item) => {
    const index = toOptionKey(item.id) === undefined ? findUnmatched(() => true) : -1
    if (index >= 0) {
      assign(index, item)
    } else {
      matched[result.length] = true
      result.push(clone(item))
    }
  })
  return result
}

// 记录一次 setOption：替换（notMerge 或新实例）时直接覆盖；合并时组件按上面的规则合并，
// 其余配置（color、textStyle 等）与 ECharts 一样深合并
const recordOption = (option: EChartsOption, replace: boolean) => {
  const { baseOption, options: timeline, media, ...rootOption } = option as Recordable
  const base: Recordable = baseOption ? { ...baseOption } : rootOption
  // 与 ECharts 一致：声明了 baseOption 时，根上的 timeline 作为其 timeline
  if (baseOption && base.timeline == null) {
    base.timeline = rootOption.timeline
  }
  if (replace || !mergedOption) {
    mergedOption = { base: clone(base), timeline: clone(timeline), media: clone(media) }
    return
  }
  const target = mergedOption.base
  Object.keys(base).forEach((key) => {
    const value = base[key]
    if (value == null) {
      return
    }
    if (echarts.ComponentModel.hasClass(key)) {
      target[key] = mergeComponentOptions(toOptionList(target[key]), toOptionList(value))
    } else {
      target[key] = target[key] == null ? clone(value) : merge(target[key], value, true)
    }
  })
  if (timeline?.length) {
    mergedOption.timeline = clone(timeline)
  }
  if (media?.length) {
    mergedOption.media = clone(media)
  }
}

const getMergedOption = ({ base, timeline, media }: MergedOption) => {
  if (timeline?.length || media?.length) {
    return { baseOption: base, options: timeline, media } as EChartsOption
  }
  return base as EChartsOption
}

const initChart = async () => {
  // 延后初始化期间组件可能已卸载
  if (isUnmounted || !unref(elRef) || !props.options) {
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
  chartThemeName = unref(echartThemeName)
  echartRef = echarts.init(unref(elRef) as HTMLElement, chartThemeName)
  recordOption(unref(options), true)
  echartRef?.setOption(unref(options), props.notMerge)
}

// ECharts 实例创建时就固定了已注册的数据处理、视觉阶段，词云扩展加载前创建的实例画不出词云：
// 在首次设置词云配置之前重建实例；合并模式下先还原旧实例已合并的配置
const reinitForWordCloud = () => {
  const oldOption = props.notMerge ? undefined : echartRef?.getOption()
  echartRef?.dispose()
  chartThemeName = unref(echartThemeName)
  echartRef = echarts.init(unref(elRef) as HTMLElement, chartThemeName)
  wordCloudReady = true
  oldOption && echartRef.setOption(oldOption)
}

// 图例选中、区域缩放与视觉映射筛选的运行时状态（只读取这些项，不回灌其它配置，避免带入旧主题的默认样式）
const getInteractionState = (chart: echarts.ECharts) => {
  const option = chart.getOption() as Recordable
  const toArray = (value: any): any[] => (Array.isArray(value) ? value : [])
  return {
    legendSelected: toArray(option.legend).map(
      (legend) => ({ ...(legend?.selected || {}) }) as Record<string, boolean>
    ),
    dataZoom: toArray(option.dataZoom).map((item) => ({ start: item?.start, end: item?.end })),
    // 连续型为 range 区间，分段型为各段的 selected
    visualMap: toArray(option.visualMap).map((item) => ({
      type: item?.type as string | undefined,
      range: Array.isArray(item?.range) ? (item.range.slice() as number[]) : undefined,
      selected: item?.selected ? ({ ...item.selected } as Record<string, boolean>) : undefined
    }))
  }
}

// 主题重建会把图例选中、区域缩放、视觉映射筛选重置为配置初值：按切换前的状态恢复，只派发有差异的项
const restoreInteractionState = (
  chart: echarts.ECharts,
  state: ReturnType<typeof getInteractionState>
) => {
  const current = getInteractionState(chart)
  state.legendSelected.forEach((selected, legendIndex) => {
    Object.keys(selected).forEach((name) => {
      // 未记录的图例项默认为选中
      if ((current.legendSelected[legendIndex]?.[name] ?? true) === selected[name]) {
        return
      }
      chart.dispatchAction({
        type: selected[name] ? 'legendSelect' : 'legendUnSelect',
        name,
        legendIndex
      })
    })
  })
  state.dataZoom.forEach(({ start, end }, dataZoomIndex) => {
    const range = current.dataZoom[dataZoomIndex]
    if (start === undefined || end === undefined || !range) {
      return
    }
    if (range.start !== start || range.end !== end) {
      chart.dispatchAction({ type: 'dataZoom', dataZoomIndex, start, end })
    }
  })
  state.visualMap.forEach(({ type, range, selected }, visualMapIndex) => {
    const visualMap = current.visualMap[visualMapIndex]
    if (!visualMap || visualMap.type !== type) {
      return
    }
    if (type === 'piecewise') {
      const isChanged = (key: string) => (visualMap.selected?.[key] ?? true) !== selected?.[key]
      if (selected && Object.keys(selected).some(isChanged)) {
        chart.dispatchAction({ type: 'selectDataRange', visualMapIndex, selected })
      }
      return
    }
    if (range && (range[0] !== visualMap.range?.[0] || range[1] !== visualMap.range?.[1])) {
      chart.dispatchAction({ type: 'selectDataRange', visualMapIndex, selected: range })
    }
  })
}

// 明暗切换：保留实例，用 ECharts 原生 setTheme 切换内置主题。
// setTheme 只按首次 setOption 的配置重建，先以累计配置不合并地重设（延迟渲染），使重建依据完整，
// 再切换主题，只渲染一次；最后恢复交互状态
const switchTheme = (chart: echarts.ECharts, themeName: string) => {
  const state = getInteractionState(chart)
  if (mergedOption) {
    chart.setOption(getMergedOption(mergedOption), { notMerge: true, lazyUpdate: true })
  }
  chart.setTheme(themeName)
  chartThemeName = themeName
  restoreInteractionState(chart, state)
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
      recordOption(options, props.notMerge)
      // 明暗切换同时改变 darkMode，必然经过这里：累计配置已含本次配置，直接按新主题重建并恢复交互状态，
      // 不再另行合并一次，否则 ECharts 会把未指定 selected 的分段型视觉映射重置为全选
      const themeName = unref(echartThemeName)
      if (echartRef && chartThemeName !== themeName) {
        switchTheme(echartRef, themeName)
      } else {
        echartRef?.setOption(options, props.notMerge)
      }
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
  // Dialog 等 v-show 容器在子组件 mounted 之后才显示，延后到本轮更新完成再初始化，避免画布宽度为 0
  nextTick(initChart)

  window.addEventListener('resize', resizeHandler)

  contentEl.value = document.getElementsByClassName(`${variables.namespace}-layout-content`)[0]
  unref(contentEl) &&
    (unref(contentEl) as Element).addEventListener('transitionend', contentResizeHandler)

  // 父容器宽高变化等非窗口触发的尺寸调整；不支持 ResizeObserver 时仍依赖上面的监听
  if (typeof ResizeObserver !== 'undefined' && unref(elRef)) {
    resizeObserver = new ResizeObserver(() => resizeHandler())
    resizeObserver.observe(unref(elRef) as HTMLElement)
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  // 作废等待词云扩展加载中的配置更新
  updateId++
  window.removeEventListener('resize', resizeHandler)
  resizeObserver?.disconnect()
  resizeObserver = undefined
  resizeHandler.cancel()
  unref(contentEl) &&
    (unref(contentEl) as Element).removeEventListener('transitionend', contentResizeHandler)
  // 销毁实例，避免卸载后的实例与事件监听残留
  echartRef?.dispose()
  echartRef = null
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
