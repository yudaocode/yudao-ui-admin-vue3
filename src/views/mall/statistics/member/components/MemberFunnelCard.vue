<template>
  <el-card shadow="never">
    <template #header>
      <div class="my--1.5 flex flex-row items-center justify-between">
        <CardTitle title="会员概览" />
        <!-- 查询条件 -->
        <ShortcutDateRangePicker @change="handleTimeRangeChange" />
      </div>
    </template>
    <div class="min-w-225 py-1.75" v-loading="loading">
      <div class="relative h-24 flex">
        <div class="h-full w-75% bg-blue-50 <lg:w-35% <xl:w-55%">
          <div class="ml-15 h-full flex flex-col justify-center">
            <div class="font-bold">
              注册用户数量：{{ analyseData?.comparison?.value?.registerUserCount || 0 }}
            </div>
            <div class="mt-2 text-3.5">
              环比增长率：{{
                calculateRelativeRate(
                  analyseData?.comparison?.value?.registerUserCount,
                  analyseData?.comparison?.reference?.registerUserCount
                )
              }}%
            </div>
          </div>
        </div>
        <div
          class="trapezoid1 ml--38.5 mt-1.5 h-full w-77 flex flex-col items-center justify-center bg-blue-5 text-3.5 text-white"
        >
          <span class="text-6 font-bold">{{ analyseData?.visitUserCount || 0 }}</span>
          <span>访客</span>
        </div>
      </div>
      <div class="relative h-24 flex">
        <div class="h-full w-75% flex bg-cyan-50 <lg:w-35% <xl:w-55%">
          <div class="ml-15 h-full flex flex-col justify-center">
            <div class="font-bold">
              活跃用户数量：{{ analyseData?.comparison?.value?.visitUserCount || 0 }}
            </div>
            <div class="mt-2 text-3.5">
              环比增长率：{{
                calculateRelativeRate(
                  analyseData?.comparison?.value?.visitUserCount,
                  analyseData?.comparison?.reference?.visitUserCount
                )
              }}%
            </div>
          </div>
        </div>
        <div
          class="trapezoid2 ml--28 mt-1.7 h-25 w-56 flex flex-col items-center justify-center bg-cyan-5 text-3.5 text-white"
        >
          <span class="text-6 font-bold">{{ analyseData?.orderUserCount || 0 }}</span>
          <span>下单</span>
        </div>
      </div>
      <div class="relative h-24 flex">
        <div class="w-75% flex bg-slate-50 <lg:w-35% <xl:w-55%">
          <div class="ml-15 h-full flex flex-row gap-x-16">
            <div class="flex flex-col justify-center">
              <div class="font-bold">
                充值用户数量：{{ analyseData?.comparison?.value?.rechargeUserCount || 0 }}
              </div>
              <div class="mt-2 text-3.5">
                环比增长率：{{
                  calculateRelativeRate(
                    analyseData?.comparison?.value?.rechargeUserCount,
                    analyseData?.comparison?.reference?.rechargeUserCount
                  )
                }}%
              </div>
            </div>
            <div class="flex flex-col justify-center">
              <div class="font-bold">客单价：{{ fenToYuan(analyseData?.atv || 0) }}</div>
            </div>
          </div>
        </div>
        <div
          class="trapezoid3 ml--18 mt-3.25 h-23 w-36 flex flex-col items-center justify-center bg-slate-5 text-3.5 text-white"
        >
          <span class="text-6 font-bold">{{ analyseData?.payUserCount || 0 }}</span>
          <span>成交用户</span>
        </div>
      </div>
    </div>
  </el-card>
</template>
<script lang="ts" setup>
import * as MemberStatisticsApi from '@/api/mall/statistics/member'
import dayjs from 'dayjs'
import { calculateRelativeRate, fenToYuan } from '@/utils'
import { MemberAnalyseRespVO } from '@/api/mall/statistics/member'
import { CardTitle } from '@/components/Card'

/** 会员概览卡片 */
defineOptions({ name: 'MemberFunnelCard' })

const loading = ref(true) // 加载中
const analyseData = ref<MemberAnalyseRespVO>() // 会员分析数据

/** 查询会员概览数据列表 */
const handleTimeRangeChange = async (times: [dayjs.ConfigType, dayjs.ConfigType]) => {
  loading.value = true
  // 查询数据
  analyseData.value = await MemberStatisticsApi.getMemberAnalyse({ times })
  loading.value = false
}
</script>
<style lang="scss" scoped>
.trapezoid1 {
  transform: perspective(5em) rotateX(-11deg);
}

.trapezoid2 {
  transform: perspective(7em) rotateX(-20deg);
}

.trapezoid3 {
  transform: perspective(3em) rotateX(-13deg);
}
</style>
