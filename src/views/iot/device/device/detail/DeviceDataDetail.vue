<!-- 设备物模型 -> 运行状态 -> 查看数据（设备的属性值历史）-->
<template>
  <Dialog title="查看数据" v-model="dialogVisible" width="1024px">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="" prop="createTime">
          <el-date-picker
            v-model="queryParams.times"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="datetimerange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="!w-360px"
            @change="handleTimeChange"
          />
        </el-form-item>
        <el-form-item class="float-right !mr-0 !mb-0">
          <el-button-group>
            <el-button
              :type="viewMode === 'chart' ? 'primary' : 'default'"
              @click="viewMode = 'chart'"
            >
              <Icon icon="ep:histogram" />
            </el-button>
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
            >
              <Icon icon="ep:list" />
            </el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 数据展示区域 -->
    <ContentWrap>
      <!-- 图表模式 -->
      <div v-if="viewMode === 'chart'" class="chart-container">
        <div v-if="sortedList.length === 0" class="text-center text-gray-500 py-20"> 暂无数据 </div>
        <Echart v-else :options="echartsOption" height="400px" />
      </div>

      <!-- 表格模式 -->
      <div v-else>
        <el-table
          v-loading="detailLoading"
          :data="sortedList"
          :stripe="true"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="时间" align="center" prop="time" width="180px">
            <template #default="scope">
              {{ formatDate(new Date(scope.row.updateTime)) }}
            </template>
          </el-table-column>
          <el-table-column label="属性值" align="center" prop="value" />
        </el-table>
      </div>
    </ContentWrap>
  </Dialog>
</template>
<script setup lang="ts">
import { DeviceApi, DeviceHistoryDataVO, DeviceVO } from '@/api/iot/device/device'
import { ProductVO } from '@/api/iot/product/product'
import { beginOfDay, endOfDay, formatDate } from '@/utils/formatTime'
import { Echart } from '@/components/Echart'

defineProps<{ product: ProductVO; device: DeviceVO }>()

/** IoT 设备数据详情 */
defineOptions({ name: 'IoTDeviceDataDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false)
const viewMode = ref<'chart' | 'list'>('chart') // 视图模式状态

const list = ref<DeviceHistoryDataVO[]>([]) // 列表的数据

// 根据视图模式排序的数据
const sortedList = computed(() => {
  if (!list.value || list.value.length === 0) return []

  const sortedData = [...list.value]

  if (viewMode.value === 'list') {
    // 列表模式：按时间倒序（最新的在前）
    return sortedData.sort((a, b) => b.time - a.time)
  } else {
    // 图表模式：按时间升序（最早的在前）
    return sortedData.sort((a, b) => a.time - b.time)
  }
})

// Echarts 配置
const echartsOption = reactive<any>({
  title: {
    text: '设备数据趋势',
    left: 'center'
  },
  grid: {
    left: 60,
    right: 40,
    bottom: 80,
    top: 80,
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  xAxis: {
    type: 'time',
    name: '时间',
    axisLabel: {
      formatter: (value: number) => formatDate(new Date(value), 'MM-DD HH:mm')
    }
  },
  yAxis: {
    type: 'value',
    name: '属性值'
  },
  series: [
    {
      name: '属性值',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color: '#1890FF'
      },
      itemStyle: {
        color: '#1890FF'
      },
      data: []
    }
  ],
  dataZoom: [
    {
      type: 'inside'
    },
    {
      type: 'slider',
      height: 30
    }
  ]
})

// 更新图表数据
const updateChartData = () => {
  if (echartsOption.series && echartsOption.series[0]) {
    echartsOption.series[0].data = sortedList.value.map((item) => [
      item.updateTime,
      parseFloat(item.value) || 0
    ])
    debugger
  }
}
const queryParams = reactive({
  deviceId: -1,
  identifier: '',
  times: [
    // 默认显示最近一周的数据
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
    formatDate(endOfDay(new Date()))
  ]
})
const queryFormRef = ref() // 搜索的表单

/** 获得设备历史数据 */
const getList = async () => {
  detailLoading.value = true
  try {
    const data = await DeviceApi.getHistoryDevicePropertyList(queryParams)
    list.value = data || []
    // 数据获取后更新图表
    nextTick(() => {
      updateChartData()
    })
  } finally {
    detailLoading.value = false
  }
}

/** 打开弹窗 */
const open = (deviceId: number, identifier: string) => {
  dialogVisible.value = true
  queryParams.deviceId = deviceId
  queryParams.identifier = identifier
  getList()
}

/** 时间变化处理 */
const handleTimeChange = () => {
  getList()
}

// 监听数据变化，更新图表
watch(
  () => sortedList.value,
  () => {
    if (viewMode.value === 'chart') {
      updateChartData()
    }
  },
  { deep: true }
)

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
