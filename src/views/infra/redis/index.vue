<template>
  <doc-alert title="Redis 缓存" url="https://doc.iocoder.cn/redis-cache/" />
  <doc-alert title="本地缓存" url="https://doc.iocoder.cn/local-cache/" />

  <el-scrollbar height="calc(100vh - 88px - 40px - 50px)">
    <el-row>
      <!-- 基本信息 -->
      <el-col :span="24" class="card-box" shadow="hover">
        <el-card>
          <el-descriptions title="基本信息" :column="6" border>
            <el-descriptions-item label="Redis版本 :">
              {{ cache?.info?.redis_version }}
            </el-descriptions-item>
            <el-descriptions-item label="运行模式 :">
              {{ cache?.info?.redis_mode == 'standalone' ? '单机' : '集群' }}
            </el-descriptions-item>
            <el-descriptions-item label="端口 :">
              {{ cache?.info?.tcp_port }}
            </el-descriptions-item>
            <el-descriptions-item label="客户端数 :">
              {{ cache?.info?.connected_clients }}
            </el-descriptions-item>
            <el-descriptions-item label="运行时间(天) :">
              {{ cache?.info?.uptime_in_days }}
            </el-descriptions-item>
            <el-descriptions-item label="使用内存 :">
              {{ cache?.info?.used_memory_human }}
            </el-descriptions-item>
            <el-descriptions-item label="使用CPU :">
              {{ cache?.info ? parseFloat(cache?.info?.used_cpu_user_children).toFixed(2) : '' }}
            </el-descriptions-item>
            <el-descriptions-item label="内存配置 :">
              {{ cache?.info?.maxmemory_human }}
            </el-descriptions-item>
            <el-descriptions-item label="AOF是否开启 :">
              {{ cache?.info?.aof_enabled == '0' ? '否' : '是' }}
            </el-descriptions-item>
            <el-descriptions-item label="RDB是否成功 :">
              {{ cache?.info?.rdb_last_bgsave_status }}
            </el-descriptions-item>
            <el-descriptions-item label="Key数量 :">
              {{ cache?.dbSize }}
            </el-descriptions-item>
            <el-descriptions-item label="网络入口/出口 :">
              {{ cache?.info?.instantaneous_input_kbps }}kps/
              {{ cache?.info?.instantaneous_output_kbps }}kps
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <!-- 命令统计 -->
      <el-col :span="12" class="mt-3">
        <el-card :gutter="12" shadow="hover">
          <div ref="commandStatsRef" class="h-88"></div>
        </el-card>
      </el-col>
      <!-- 内存使用量统计 -->
      <el-col :span="12" class="mt-3">
        <el-card class="ml-3" :gutter="12" shadow="hover">
          <div ref="usedmemory" class="h-88"></div>
        </el-card>
      </el-col>
    </el-row>
  </el-scrollbar>
</template>
<script setup lang="ts" name="InfraRedis">
import * as echarts from 'echarts'
import * as RedisApi from '@/api/infra/redis'
import { RedisMonitorInfoVO } from '@/api/infra/redis/types'

const cache = ref<RedisMonitorInfoVO>()

// 基本信息
const readRedisInfo = async () => {
  const data = await RedisApi.getCache()
  cache.value = data
  loadEchartOptions(data.commandStats)
}
// 图表
const commandStatsRef = ref<HTMLElement>()
const usedmemory = ref<HTMLDivElement>()

const loadEchartOptions = (stats) => {
  const commandStats = [] as any[]
  const nameList = [] as string[]
  stats.forEach((row) => {
    commandStats.push({
      name: row.command,
      value: row.calls
    })
    nameList.push(row.command)
  })

  const commandStatsInstance = echarts.init(commandStatsRef.value!, 'macarons')

  commandStatsInstance.setOption({
    title: {
      text: '命令统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 30,
      top: 10,
      bottom: 20,
      data: nameList,
      textStyle: {
        color: '#a1a1a1'
      }
    },
    series: [
      {
        name: '命令',
        type: 'pie',
        radius: [20, 120],
        center: ['40%', '60%'],
        data: commandStats,
        roseType: 'radius',
        label: {
          show: true
        },
        emphasis: {
          label: {
            show: true
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })

  const usedMemoryInstance = echarts.init(usedmemory.value!, 'macarons')
  usedMemoryInstance.setOption({
    title: {
      text: '内存使用情况',
      left: 'center'
    },
    tooltip: {
      formatter: '{b} <br/>{a} : ' + cache.value!.info.used_memory_human
    },
    series: [
      {
        name: '峰值',
        type: 'gauge',
        min: 0,
        max: 100,
        progress: {
          show: true
        },
        detail: {
          formatter: cache.value!.info.used_memory_human
        },
        data: [
          {
            value: parseFloat(cache.value!.info.used_memory_human),
            name: '内存消耗'
          }
        ]
      }
    ]
  })
}

onBeforeMount(() => {
  // TODO @hiiwbs 微信，优化使用 Echart 组件
  readRedisInfo()
})
</script>
