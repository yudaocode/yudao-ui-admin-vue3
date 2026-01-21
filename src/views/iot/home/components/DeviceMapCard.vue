<template>
  <el-card class="chart-card" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-base font-medium text-gray-600">设备分布地图</span>
        <div class="flex items-center gap-4 text-sm">
          <span v-for="item in stateOptions" :key="item.value" class="flex items-center gap-1">
            <span
              class="inline-block w-3 h-3 rounded-full"
              :style="{ backgroundColor: stateColorMap[item.value] }"
            ></span>
            <span class="text-gray-500">{{ item.label }}</span>
          </span>
        </div>
      </div>
    </template>
    <div v-if="loading" class="h-[500px] flex justify-center items-center">
      <el-empty description="加载中..." />
    </div>
    <div v-else-if="!hasData" class="h-[500px] flex justify-center items-center">
      <el-empty description="暂无设备位置数据" />
    </div>
    <div v-show="hasData && !loading" ref="mapContainerRef" class="h-[500px] w-full"></div>
  </el-card>
</template>

<script lang="ts" setup>
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { useRouter } from 'vue-router'
import { DICT_TYPE, getDictObj, getIntDictOptions } from '@/utils/dict'
import { DeviceStateEnum } from '@/views/iot/utils/constants'
import { loadBaiduMapSdk } from '@/components/Map/src/utils'

defineOptions({ name: 'DeviceMapCard' })

const router = useRouter()
const mapContainerRef = ref<HTMLElement>()
let mapInstance: any = null
const loading = ref(true)
const deviceList = ref<DeviceVO[]>([])

/** 是否有数据 */
const hasData = computed(() => deviceList.value.length > 0)

/** 状态图例列表（从字典获取） */
const stateOptions = computed(() => getIntDictOptions(DICT_TYPE.IOT_DEVICE_STATE))

/** 设备状态颜色映射 */
const stateColorMap: Record<number, string> = {
  [DeviceStateEnum.INACTIVE]: '#EAB308', // 待激活 - 黄色
  [DeviceStateEnum.ONLINE]: '#22C55E', // 在线 - 绿色
  [DeviceStateEnum.OFFLINE]: '#9CA3AF' // 离线 - 灰色
}

/** 获取设备状态配置（从字典获取） */
const getStateConfig = (state: number): { name: string; color: string } => {
  const dict = getDictObj(DICT_TYPE.IOT_DEVICE_STATE, state)
  return {
    name: dict?.label || '未知',
    color: stateColorMap[state] || '#909399'
  }
}

/** 创建自定义标记点图标 */
const createMarkerIcon = (color: string, isOnline: boolean) => {
  const size = isOnline ? 24 : 20
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
      ${isOnline ? `<circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>` : ''}
    </svg>
  `
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  return new window.BMapGL.Icon(url, new window.BMapGL.Size(size, size), {
    anchor: new window.BMapGL.Size(size / 2, size / 2)
  })
}

/** 初始化地图 */
const initMap = () => {
  if (!mapContainerRef.value || !window.BMapGL) {
    return
  }

  // 销毁旧实例
  if (mapInstance) {
    mapInstance.destroy?.()
    mapInstance = null
  }

  // 创建地图实例，默认以中国为中心
  mapInstance = new window.BMapGL.Map(mapContainerRef.value)
  mapInstance.centerAndZoom(new window.BMapGL.Point(106, 37.5), 5)
  mapInstance.enableScrollWheelZoom()

  // 添加控件
  mapInstance.addControl(new window.BMapGL.ScaleControl())
  mapInstance.addControl(new window.BMapGL.ZoomControl())

  // 添加设备标记点
  deviceList.value.forEach((device) => {
    const config = getStateConfig(device.state)
    const isOnline = device.state === DeviceStateEnum.ONLINE
    const point = new window.BMapGL.Point(device.longitude, device.latitude)

    // 创建标记
    const marker = new window.BMapGL.Marker(point, {
      icon: createMarkerIcon(config.color, isOnline)
    })

    // 创建信息窗口内容
    const infoContent = `
      <div style="padding: 8px; min-width: 180px;">
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${device.nickname || device.deviceName}</div>
        <div style="color: #666; font-size: 12px; line-height: 1.8;">
          <div>产品: ${device.productName || '-'}</div>
          <div>状态: <span style="color: ${config.color}; font-weight: 500;">${config.name}</span></div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          <a href="javascript:void(0)" style="color: #409EFF; font-size: 12px; text-decoration: none;">点击查看详情 →</a>
        </div>
      </div>
    `

    // 点击标记显示信息窗口
    marker.addEventListener('click', () => {
      const infoWindow = new window.BMapGL.InfoWindow(infoContent, {
        width: 220,
        height: 140,
        title: ''
      })

      // 信息窗口打开后绑定链接点击事件
      infoWindow.addEventListener('open', () => {
        setTimeout(() => {
          const link = document.querySelector('.BMap_bubble_content a')
          if (link) {
            link.addEventListener('click', (e) => {
              e.preventDefault()
              router.push({ name: 'IoTDeviceDetail', params: { id: device.id } })
            })
          }
        }, 100)
      })

      mapInstance.openInfoWindow(infoWindow, point)
    })

    mapInstance.addOverlay(marker)
  })
}

/** 加载设备数据 */
const loadDeviceData = async () => {
  loading.value = true
  try {
    deviceList.value = await DeviceApi.getDeviceLocationList()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
const init = async () => {
  await loadDeviceData()
  if (!hasData.value) {
    return
  }
  await loadBaiduMapSdk()
  await nextTick()
  initMap()
}

/** 组件挂载时初始化 */
onMounted(() => {
  init()
})

/** 组件卸载时销毁地图实例 */
onUnmounted(() => {
  if (mapInstance) {
    mapInstance.destroy?.()
    mapInstance = null
  }
})
</script>
