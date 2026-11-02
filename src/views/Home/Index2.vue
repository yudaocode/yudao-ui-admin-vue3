<template>
  <el-row :class="prefixCls" :gutter="20" justify="space-between">
    <el-col :lg="6" :md="12" :sm="12" :xl="6" :xs="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" :rows="2" animated>
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div
                  :class="`${prefixCls}__item--icon ${prefixCls}__item--peoples p-16px inline-block rounded-6px`"
                >
                  <Icon :size="40" icon="svg-icon:peoples" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">
                  {{ t('analysis.newUser') }}
                </div>
                <CountTo
                  :duration="2600"
                  :end-val="102400"
                  :start-val="0"
                  class="text-right text-20px font-700"
                />
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>

    <el-col :lg="6" :md="12" :sm="12" :xl="6" :xs="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" :rows="2" animated>
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div
                  :class="`${prefixCls}__item--icon ${prefixCls}__item--message p-16px inline-block rounded-6px`"
                >
                  <Icon :size="40" icon="svg-icon:message" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">
                  {{ t('analysis.unreadInformation') }}
                </div>
                <CountTo
                  :duration="2600"
                  :end-val="81212"
                  :start-val="0"
                  class="text-right text-20px font-700"
                />
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>

    <el-col :lg="6" :md="12" :sm="12" :xl="6" :xs="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" :rows="2" animated>
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div
                  :class="`${prefixCls}__item--icon ${prefixCls}__item--money p-16px inline-block rounded-6px`"
                >
                  <Icon :size="40" icon="svg-icon:money" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">
                  {{ t('analysis.transactionAmount') }}
                </div>
                <CountTo
                  :duration="2600"
                  :end-val="9280"
                  :start-val="0"
                  class="text-right text-20px font-700"
                />
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>

    <el-col :lg="6" :md="12" :sm="12" :xl="6" :xs="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" :rows="2" animated>
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div
                  :class="`${prefixCls}__item--icon ${prefixCls}__item--shopping p-16px inline-block rounded-6px`"
                >
                  <Icon :size="40" icon="svg-icon:shopping" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">
                  {{ t('analysis.totalShopping') }}
                </div>
                <CountTo
                  :duration="2600"
                  :end-val="13600"
                  :start-val="0"
                  class="text-right text-20px font-700"
                />
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>
  <el-row :gutter="20" justify="space-between">
    <el-col :lg="10" :md="24" :sm="24" :xl="10" :xs="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" animated>
          <Echart :height="300" :options="pieOptionsData" />
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :lg="14" :md="24" :sm="24" :xl="14" :xs="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" animated>
          <Echart :height="300" :options="barOptionsData" />
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :span="24">
      <el-card class="mb-20px" shadow="hover">
        <el-skeleton :loading="loading" :rows="4" animated>
          <Echart :height="350" :options="lineOptionsData" />
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>
</template>
<script lang="ts" setup>
import { cloneDeep, set } from 'lodash-es'
import { EChartsOption } from 'echarts'

import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import type { AnalysisTotalTypes } from './types'
import { barOptions, lineOptions, pieOptions } from './echarts-data'

defineOptions({ name: 'Home2' })

const { t } = useI18n()
const loading = ref(true)
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('panel')
// 使用页面内深拷贝，避免数据与明暗颜色写回 echarts-data 中与其它首页共享的配置对象
const pieOptionsData = reactive<EChartsOption>(cloneDeep(pieOptions)) as EChartsOption

let totalState = reactive<AnalysisTotalTypes>({
  users: 0,
  messages: 0,
  moneys: 0,
  shoppings: 0
})

const getCount = async () => {
  const data = {
    users: 102400,
    messages: 81212,
    moneys: 9280,
    shoppings: 13600
  }
  totalState = Object.assign(totalState, data)
}

// 用户来源
const getUserAccessSource = async () => {
  const data = [
    { value: 335, name: 'analysis.directAccess' },
    { value: 310, name: 'analysis.mailMarketing' },
    { value: 234, name: 'analysis.allianceAdvertising' },
    { value: 135, name: 'analysis.videoAdvertising' },
    { value: 1548, name: 'analysis.searchEngines' }
  ]
  set(
    pieOptionsData,
    'legend.data',
    data.map((v) => t(v.name))
  )
  // series 为数组，需更新第一个饼图的 data；名称与图例一致使用翻译后的文本
  set(
    pieOptionsData,
    'series[0].data',
    data.map((v) => ({ name: t(v.name), value: v.value }))
  )
}
const barOptionsData = reactive<EChartsOption>(cloneDeep(barOptions)) as EChartsOption

// 周活跃量
const getWeeklyUserActivity = async () => {
  const data = [
    { value: 13253, name: 'analysis.monday' },
    { value: 34235, name: 'analysis.tuesday' },
    { value: 26321, name: 'analysis.wednesday' },
    { value: 12340, name: 'analysis.thursday' },
    { value: 24643, name: 'analysis.friday' },
    { value: 1322, name: 'analysis.saturday' },
    { value: 1324, name: 'analysis.sunday' }
  ]
  set(
    barOptionsData,
    'xAxis.data',
    data.map((v) => t(v.name))
  )
  set(barOptionsData, 'series', [
    {
      name: t('analysis.activeQuantity'),
      data: data.map((v) => v.value),
      type: 'bar'
    }
  ])
}

const lineOptionsData = reactive<EChartsOption>(cloneDeep(lineOptions)) as EChartsOption

// 每月销售总额
const getMonthlySales = async () => {
  const data = [
    { estimate: 100, actual: 120, name: 'analysis.january' },
    { estimate: 120, actual: 82, name: 'analysis.february' },
    { estimate: 161, actual: 91, name: 'analysis.march' },
    { estimate: 134, actual: 154, name: 'analysis.april' },
    { estimate: 105, actual: 162, name: 'analysis.may' },
    { estimate: 160, actual: 140, name: 'analysis.june' },
    { estimate: 165, actual: 145, name: 'analysis.july' },
    { estimate: 114, actual: 250, name: 'analysis.august' },
    { estimate: 163, actual: 134, name: 'analysis.september' },
    { estimate: 185, actual: 56, name: 'analysis.october' },
    { estimate: 118, actual: 99, name: 'analysis.november' },
    { estimate: 123, actual: 123, name: 'analysis.december' }
  ]
  set(
    lineOptionsData,
    'xAxis.data',
    data.map((v) => t(v.name))
  )
  set(lineOptionsData, 'series', [
    {
      name: t('analysis.estimate'),
      smooth: true,
      type: 'line',
      data: data.map((v) => v.estimate),
      animationDuration: 2800,
      animationEasing: 'cubicInOut'
    },
    {
      name: t('analysis.actual'),
      smooth: true,
      type: 'line',
      itemStyle: {},
      data: data.map((v) => v.actual),
      animationDuration: 2800,
      animationEasing: 'quadraticOut'
    }
  ])
}

const getAllApi = async () => {
  await Promise.all([getCount(), getUserAccessSource(), getWeeklyUserActivity(), getMonthlySales()])
  loading.value = false
}

getAllApi()

const appStore = useAppStore()
const isDark = computed(() => appStore.getIsDark)

// 标题、图例文字及空饼圈颜色随明暗切换：只设置 color 叶子，保留其它文字样式与图例选中状态
const updateTextColor = (dark: boolean) => {
  const color = dark ? '#ccc' : '#333'
  const inactiveColor = dark ? '#abacac' : '#ccc'
  for (const options of [pieOptionsData, barOptionsData, lineOptionsData]) {
    set(options, 'title.textStyle.color', color)
  }
  for (const options of [pieOptionsData, lineOptionsData]) {
    set(options, 'legend.textStyle.color', color)
    set(options, 'legend.inactiveColor', inactiveColor)
  }
  set(pieOptionsData, 'series[0].emptyCircleStyle.color', inactiveColor)
}

watch(isDark, updateTextColor, { immediate: true })
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-panel;

.#{$prefix-cls} {
  &__item {
    &--peoples {
      color: #40c9c6;
    }

    &--message {
      color: #36a3f7;
    }

    &--money {
      color: #f4516c;
    }

    &--shopping {
      color: #34bfa3;
    }

    &:hover {
      :deep(.#{$namespace}-icon) {
        color: #fff !important;
      }

      .#{$prefix-cls}__item--icon {
        transition: all 0.38s ease-out;
      }

      .#{$prefix-cls}__item--peoples {
        background: #40c9c6;
      }

      .#{$prefix-cls}__item--message {
        background: #36a3f7;
      }

      .#{$prefix-cls}__item--money {
        background: #f4516c;
      }

      .#{$prefix-cls}__item--shopping {
        background: #34bfa3;
      }
    }
  }
}
</style>
