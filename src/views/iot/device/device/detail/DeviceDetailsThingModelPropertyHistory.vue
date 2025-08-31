<!-- 设备物模型 -> 运行状态 -> 查看数据（设备的属性值历史）-->
<template>
  <Dialog title="查看数据" v-model="dialogVisible" width="1024px" :appendToBody="true">
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
            :shortcuts="defaultShortcuts"
          />
        </el-form-item>
        <el-form-item class="float-right !mr-0 !mb-0">
          <el-button-group>
            <el-button
              :type="viewMode === 'chart' ? 'primary' : 'default'"
              @click="viewMode = 'chart'"
              :disabled="isComplexDataType"
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
        <div v-if="list.length === 0" class="text-center text-gray-500 py-20"> 暂无数据 </div>
        <Echart v-else :key="'erchart' + Date.now()" :options="echartsOption" height="400px" />
      </div>

      <!-- 表格模式 -->
      <div v-else>
        <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
          <el-table-column label="时间" align="center" prop="time" width="180px">
            <template #default="scope">
              {{ formatDate(new Date(scope.row.updateTime)) }}
            </template>
          </el-table-column>
          <el-table-column label="属性值" align="center" prop="value">
            <template #default="scope">
              {{ scope.row.value }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </ContentWrap>
  </Dialog>
</template>
<script setup lang="ts">
import { DeviceApi, IotDevicePropertyRespVO } from '@/api/iot/device/device'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { Echart } from '@/components/Echart'
import { IoTDataSpecsDataTypeEnum } from '@/views/iot/utils/constants'

defineProps<{ deviceId: number }>()

/** IoT 设备属性历史数据详情 */
defineOptions({ name: 'DeviceDetailsThingModelPropertyHistory' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false)
const viewMode = ref<'chart' | 'list'>('chart') // 视图模式状态
const list = ref<IotDevicePropertyRespVO[]>([]) // 列表的数据
const chartKey = ref(0) // 图表重新渲染的key
const thingModelDataType = ref<string>('') // 物模型数据类型
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

// 判断是否为复杂数据类型（struct 或 array）
const isComplexDataType = computed(() => {
  if (!thingModelDataType.value) return false
  return [IoTDataSpecsDataTypeEnum.STRUCT, IoTDataSpecsDataTypeEnum.ARRAY].includes(
    thingModelDataType.value as any
  )
})

// Echarts 数据
const echartsData = computed(() => {
  if (!list.value || list.value.length === 0) return []
  return list.value.map((item) => [item.updateTime, item.value])
})
// Echarts 配置
const echartsOption = reactive<any>({
  title: {
    text: '设备属性值',
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

/** 获得设备历史数据 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeviceApi.getHistoryDevicePropertyList(queryParams)
    list.value = data || []
    updateChartData()
  } finally {
    loading.value = false
  }
}

/** 打开弹窗 */
const open = async (deviceId: number, identifier: string, dataType: string) => {
  dialogVisible.value = true
  queryParams.deviceId = deviceId
  queryParams.identifier = identifier
  thingModelDataType.value = dataType

  // 如果物模型是 struct、array，需要默认使用 list 模式
  if (isComplexDataType.value) {
    viewMode.value = 'list'
  } else {
    viewMode.value = 'chart'
  }
  // 重置图表 key，确保每次打开都能正常渲染
  chartKey.value = 0

  // 等待弹窗完全渲染后再获取数据
  await nextTick()
  await getList()
}

/** 时间变化处理 */
const handleTimeChange = () => {
  getList()
}

/** 更新图表数据 */
const updateChartData = () => {
  if (echartsOption.series && echartsOption.series[0]) {
    echartsOption.series[0].data = echartsData.value
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
