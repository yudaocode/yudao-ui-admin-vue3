<!-- 地图选择弹窗组件：基于百度地图 GL 实现 -->
<template>
  <Dialog
    title="百度地图"
    v-model="dialogVisible"
    @opened="handleDialogOpened"
    @closed="handleDialogClosed"
  >
    <div class="w-full">
      <!-- 第一行：位置搜索 -->
      <el-form label-width="80px">
        <el-form-item label="定位位置">
          <el-select
            class="w-full"
            v-model="state.address"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="可输入地址查询经纬度"
            :remote-method="autoSearch"
            @change="handleAddressSelect"
            :loading="state.loading"
          >
            <el-option
              v-for="item in state.mapAddressOptions"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <!-- 第二行：坐标显示 -->
        <el-form-item label="当前坐标">
          <div class="flex items-center gap-4">
            <span>经度: {{ state.longitude || '-' }}</span>
            <span>纬度: {{ state.latitude || '-' }}</span>
          </div>
        </el-form-item>
      </el-form>
      <!-- 第三行：地图 -->
      <div
        v-if="state.mapContainerReady"
        ref="mapContainerRef"
        class="w-full h-[400px] mt-[10px]"
      ></div>
      <div v-else class="w-full h-[400px] mt-[10px] flex items-center justify-center">
        <span class="text-gray-400">地图加载中...</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleConfirm" type="primary">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick } from 'vue'
import { loadBaiduMapSdk } from './utils'

const emits = defineEmits(['confirm'])

const dialogVisible = ref(false)
const mapContainerRef = ref<HTMLElement>()
const state = reactive({
  lonLat: '', // 经纬度字符串，格式为 "经度,纬度"
  address: '', // 地址信息
  loading: false, // 地址搜索加载状态
  latitude: '', // 纬度
  longitude: '', // 经度
  map: null as any, // 百度地图实例
  mapAddressOptions: [] as any[], // 地址搜索选项
  mapMarker: null as any, // 地图标记点
  geocoder: null as any, // 地理编码器实例
  mapContainerReady: false // 地图容器是否准备好
})

// 初始经纬度（打开弹窗时传入）
const initLongitude = ref<number | undefined>()
const initLatitude = ref<number | undefined>()

/** 打开弹窗 */
const open = (longitude?: number, latitude?: number) => {
  initLongitude.value = longitude
  initLatitude.value = latitude
  state.longitude = longitude ? String(longitude) : ''
  state.latitude = latitude ? String(latitude) : ''
  state.address = ''
  state.mapAddressOptions = []
  dialogVisible.value = true
}

defineExpose({ open })

/** 弹窗打开动画完成后初始化地图 */
const handleDialogOpened = async () => {
  // 先显示地图容器
  state.mapContainerReady = true

  // 等待下一个 DOM 更新周期，确保地图容器已渲染
  await nextTick()
  // 加载百度地图 SDK
  await loadBaiduMapSdk()
  initMapInstance()
}

/** 弹窗关闭后清理地图 */
const handleDialogClosed = () => {
  // 销毁地图实例
  if (state.map) {
    state.map.destroy?.()
    state.map = null
  }
  state.mapMarker = null
  state.geocoder = null
  state.mapContainerReady = false
}

/** 初始化地图实例 */
const initMapInstance = () => {
  if (!mapContainerRef.value) {
    return
  }

  // 初始化地图和地理编码器
  initMap()
  initGeocoder()

  // 监听地图点击事件
  state.map.addEventListener('click', (e: any) => {
    const point = e.latlng
    state.lonLat = point.lng + ',' + point.lat
    regeoCode(state.lonLat)
  })

  // 如果有初始经纬度，加载标记点
  if (initLongitude.value && initLatitude.value) {
    const lonLat = `${initLongitude.value},${initLatitude.value}`
    regeoCode(lonLat)
  }
}

/** 初始化地图 */
const initMap = () => {
  state.map = new window.BMapGL.Map(mapContainerRef.value)
  state.map.centerAndZoom(new window.BMapGL.Point(116.404, 39.915), 11)
  state.map.enableScrollWheelZoom()
  state.map.disableDoubleClickZoom()

  state.map.addControl(new window.BMapGL.NavigationControl())
  state.map.addControl(new window.BMapGL.ScaleControl())
  state.map.addControl(new window.BMapGL.ZoomControl())
}

/** 初始化地理编码器 */
const initGeocoder = () => {
  state.geocoder = new window.BMapGL.Geocoder()
}

/** 搜索地址 */
const autoSearch = (queryValue: string) => {
  if (!queryValue) {
    state.mapAddressOptions = []
    return
  }

  state.loading = true

  // noinspection JSUnusedGlobalSymbols
  const localSearch = new window.BMapGL.LocalSearch(state.map, {
    onSearchComplete: (results: any) => {
      state.loading = false
      const temp: any[] = []

      if (results && results._pois) {
        results._pois.forEach((p: any) => {
          const point = p.point
          if (point && point.lng && point.lat) {
            temp.push({
              name: p.title,
              value: point.lng + ',' + point.lat
            })
          }
        })
      }

      state.mapAddressOptions = temp
    }
  })

  localSearch.search(queryValue)
}

/** 处理地址选择 */
const handleAddressSelect = (value: string) => {
  if (value) {
    regeoCode(value)
  }
}

/** 添加标记点 */
const setMarker = (lnglat: string[]) => {
  if (!lnglat) {
    return
  }

  if (state.mapMarker !== null) {
    state.map.removeOverlay(state.mapMarker)
  }

  const point = new window.BMapGL.Point(lnglat[0], lnglat[1])
  state.mapMarker = new window.BMapGL.Marker(point)

  state.map.addOverlay(state.mapMarker)
  state.map.centerAndZoom(point, 16)
}

/** 经纬度转地址、添加标记点 */
const regeoCode = (lonLat: string) => {
  if (!lonLat) {
    return
  }
  const lnglat = lonLat.split(',')
  if (lnglat.length !== 2) {
    return
  }

  state.longitude = lnglat[0]
  state.latitude = lnglat[1]
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1])
  state.map.centerAndZoom(point, 16)

  setMarker(lnglat)
  getAddress(lnglat)
}

/** 根据经纬度获取地址信息 */
const getAddress = (lnglat: string[]) => {
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1])
  state.geocoder.getLocation(point, (result: any) => {
    if (result && result.address) {
      state.address = result.address
    }
  })
}

/** 确认选择 */
const handleConfirm = () => {
  if (state.longitude && state.latitude) {
    emits('confirm', {
      longitude: state.longitude,
      latitude: state.latitude,
      address: state.address
    })
  }
  dialogVisible.value = false
}
</script>
