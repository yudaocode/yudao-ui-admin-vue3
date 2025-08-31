<!-- 地图组件：基于百度地图GL实现 -->
<!-- TODO @super：还存在两个没解决的小bug,一个是修改手动定位时一次加载 不知道为何定位点在地图左上角 调了半天没解决 第二个是检索地址确定定位的功能参照百度的文档没也搞好 回头再解决一下 -->
<template>
  <div v-if="props.isWrite">
    <el-form ref="form" label-width="120px">
      <el-form-item label="定位位置:">
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
            v-for="item in state.mapAddrOptions"
            :key="item.value"
            :label="item.name"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="设备地图:">
        <!-- TODO @super：这里看看 unocss 哈 -->
        <div id="bdMap" class="mapContainer"></div>
      </el-form-item>
    </el-form>
  </div>
  <div v-else>
    <el-descriptions :column="2" border :labelStyle="{ 'font-weight': 'bold' }">
      <el-descriptions-item label="设备位置:">{{ state.address }}</el-descriptions-item>
    </el-descriptions>
    <div id="bdMap" class="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { propTypes } from '@/utils/propTypes'

// 扩展 Window 接口以包含百度地图 GL API
declare global {
  interface Window {
    BMapGL: any
    initBaiduMap: () => void
  }
}

const emits = defineEmits(['locateChange', 'update:center'])
const state = reactive({
  lonLat: '', // 经度,纬度
  address: '',
  loading: false,
  latitude: '', // 纬度
  longitude: '', // 经度
  map: null as any, // 地图对象
  mapAddrOptions: [] as any[],
  mapMarker: null as any, // 标记对象
  geocoder: null as any,
  autoComplete: null as any,
  tips: [] // 搜索提示
})

const props = defineProps({
  clickMap: propTypes.bool.def(false),
  isWrite: propTypes.bool.def(false),
  center: propTypes.string.def('')
})

/** 加载百度地图 */
const loadMap = () => {
  state.address = ''
  state.latitude = ''
  state.longitude = ''

  // 创建百度地图 API 脚本，动态加载
  const script = document.createElement('script')
  script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${
    import.meta.env.VITE_BAIDU_MAP_KEY
  }&callback=initBaiduMap`
  document.body.appendChild(script)

  // 定义全局回调函数
  window.initBaiduMap = () => {
    initMap()
    initGeocoder()
    initAutoComplete()

    // TODO @super：这里加一行注释
    if (props.clickMap) {
      state.map.addEventListener('click', (e: any) => {
        console.log(e)
        const point = e.latlng
        console.log(point)
        state.lonLat = point.lng + ',' + point.lat
        console.log(state.lonLat)
        regeoCode(state.lonLat)
      })
    }

    // TODO @super：这里加一行注释
    if (props.center) {
      regeoCode(props.center)
    }
  }
}

/** 初始化地图 */
const initMap = () => {
  const mapId = 'bdMap'
  state.map = new window.BMapGL.Map(mapId)
  // TODO @super：这个是默认的哇？
  state.map.centerAndZoom(new window.BMapGL.Point(116.404, 39.915), 11)
  state.map.enableScrollWheelZoom()
  state.map.disableDoubleClickZoom()

  // 添加地图控件
  state.map.addControl(new window.BMapGL.NavigationControl())
  state.map.addControl(new window.BMapGL.ScaleControl())
  state.map.addControl(new window.BMapGL.ZoomControl())
}

/** 初始化地理编码器 */
const initGeocoder = () => {
  state.geocoder = new window.BMapGL.Geocoder()
}

/** 初始化自动完成 */
const initAutoComplete = () => {
  state.autoComplete = new window.BMapGL.Autocomplete({
    input: 'searchInput',
    location: state.map
  })
}

/**
 * 搜索地址
 * @param queryValue 搜索关键词
 */
const autoSearch = (queryValue: string) => {
  if (!queryValue) {
    state.mapAddrOptions = []
    return
  }

  state.loading = true

  // 使用百度地图地点检索服务
  const localSearch = new window.BMapGL.LocalSearch(state.map, {
    onSearchComplete: (results: any) => {
      state.loading = false
      const temp: any[] = []

      if (results && results.getPoi) {
        const pois = results.getPoi()
        pois.forEach((p: any) => {
          const point = p.point
          if (point && point.lng && point.lat) {
            temp.push({
              name: p.title,
              value: point.lng + ',' + point.lat
            })
          }
        })
      }

      state.mapAddrOptions = temp
    }
  })

  localSearch.search(queryValue)
}

/**
 * 处理地址选择
 * @param value 选中的地址值
 */
const handleAddressSelect = (value: string) => {
  if (value) {
    regeoCode(value)
  }
}

/**
 * 添加标记点
 * @param lnglat 经纬度数组
 */
// TODO @super：拼写；尽量不要有 idea 绿色提醒哈
const setMarker = (lnglat: any) => {
  if (!lnglat) return

  // 如果点标记已存在则先移除原点
  if (state.mapMarker !== null) {
    state.map.removeOverlay(state.mapMarker)
    state.lonLat = ''
  }

  // 创建新的标记点
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1])
  state.mapMarker = new window.BMapGL.Marker(point)

  // 添加点标记到地图
  state.map.addOverlay(state.mapMarker)
  state.map.centerAndZoom(point, 16)
}

/**
 * 经纬度转化为地址、添加标记点
 * @param lonLat 经度,纬度字符串
 */
// TODO @super：拼写；尽量不要有 idea 绿色提醒哈
const regeoCode = (lonLat: string) => {
  if (!lonLat) return

  // TODO @super：拼写；尽量不要有 idea 绿色提醒哈
  const lnglat = lonLat.split(',')
  if (lnglat.length !== 2) return

  state.longitude = lnglat[0]
  state.latitude = lnglat[1]

  // 通知父组件位置变更
  emits('locateChange', lnglat)
  emits('update:center', lonLat)

  // 先将地图中心点设置到目标位置
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1])
  state.map.centerAndZoom(point, 16)

  // 再设置标记并获取地址
  setMarker(lnglat)
  getAddress(lnglat)
}

// TODO @super：lnglat 拼写
/**
 * 根据经纬度获取地址信息
 *
 * @param lnglat 经纬度数组
 */
const getAddress = (lnglat: any) => {
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1])

  state.geocoder.getLocation(point, (result: any) => {
    if (result && result.address) {
      state.address = result.address
    }
  })
}

/** 显式暴露方法，使其可以被父组件访问 */
defineExpose({ regeoCode })

onMounted(() => {
  loadMap()
})
</script>

<style scoped>
.mapContainer {
  width: 100%;
  height: 400px;
}
</style>
