<template>
  <div v-if="props.isWrite">
    <el-form ref="form" label-width="120px">
      <el-form-item label="定位位置:">
        <el-select
          style="width: 100%"
          v-model="state.address"
          clearable
          filterable
          remote
          reserve-keyword
          placeholder="可输入地址查询经纬度"
          :remote-method="autoSearch"
          @change="regeoCode"
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
        <div id="rwMap" class="mapContainer"></div>
      </el-form-item>
    </el-form>
  </div>
  <div v-else>
    <el-descriptions :column="2" border :labelStyle="{ 'font-weight': 'bold' }">
      <el-descriptions-item label="设备位置:">{{ state.address }}</el-descriptions-item>
    </el-descriptions>
    <div id="rMap" class="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import AMapLoader from '@amap/amap-jsapi-loader'
import { propTypes } from '@/utils/propTypes'

const emits = defineEmits(['locateChange', 'update:center'])
const state = reactive({
  lonLat: '',
  address: '',
  loading: false,
  //纬度、经度
  latitude: '',
  longitude: '',
  //地图对象
  map: null as any,
  mapAddrOptions: [] as any[],
  //标记对象
  mapMarker: null as any,
  geocoder: null as any,
  autoComplete: null as any,
  //搜索提示
  tips: []
})
const props = defineProps({
  clickMap: propTypes.bool.def(false),
  isWrite: propTypes.bool.def(false),
  center: propTypes.string.def('')
})
const loadMap = () => {
  ;(window as any)._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE
  }
  state.address = ''
  state.latitude = ''
  state.longitude = ''
  AMapLoader.load({
    key: import.meta.env.VITE_AMAP_KEY, // 申请好的Web端开发者Key，首次调用 load 时必填
    version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: [
      //逆解析插件
      'AMap.Geocoder',
      'AMap.AutoComplete'
    ]
  }).then(() => {
    initMap()
    if (props.clickMap) {
      state.map.on('click', (e) => {
        state.lonLat = e.lnglat.lng + ',' + e.lnglat.lat
        regeoCode(state.lonLat)
      })
    }
    initGeocoder()
    initAutoComplete()
    if (props.center) {
      regeoCode(props.center)
    }
  })
}

const initMap = () => {
  let mapId = props.isWrite ? 'rwMap' : 'rMap'
  state.map = new (window as any).AMap.Map(mapId, {
    resizeEnable: true,
    zoom: 11, //地图显示的缩放级别
    keyboardEnable: false
  })
}

const initGeocoder = () => {
  state.geocoder = new (window as any).AMap.Geocoder({
    city: '010', //城市设为北京，默认：“全国”
    radius: 500, //范围，默认：500
    extensions: 'all'
  })
}

const initAutoComplete = () => {
  const autoOptions = {
    city: '全国'
  }
  state.autoComplete = new (window as any).AMap.AutoComplete(autoOptions)
}

const autoSearch = (queryValue: string) => {
  state.autoComplete.search(queryValue, (status, result) => {
    var res = result.tips || [] // 搜索成功时，result即是对应的匹配数据
    const temp = ref<any[]>([])
    res.forEach((p) => {
      if ((p.name, p.location.lng && p.location.lat)) {
        temp.value.push({
          name: p.district + p.name,
          value: p.location.lng + ',' + p.location.lat
        })
      }
    })
    state.mapAddrOptions = temp.value
  })
}

//添加标记点
const setMarker = (lnglat) => {
  if (lnglat) {
    if (state.mapMarker !== null) {
      // 如果点标记已存在则先移除原点
      state.map.remove(state.mapMarker)
      state.lonLat = ''
    }
    state.mapMarker = new (window as any).AMap.Marker({
      // 定义点标记对象
      position: new (window as any).AMap.LngLat(lnglat[0], lnglat[1])
    })
    state.map.add(state.mapMarker) // 添加点标记在地图上
    state.map.setCenter(lnglat)
    state.map.setZoom(16)
    state.mapMarker.setPosition(lnglat)
  }
}

//经纬度转化为地址、添加标记点
const regeoCode = (lonLat) => {
  if (lonLat) {
    let lnglat = lonLat.split(',')
    state.latitude = lnglat[0]
    state.longitude = lnglat[1]
    emits('locateChange', lnglat)
    emits('update:center', lonLat)
    setMarker(lnglat)
    getAddress(lnglat)
    console.log('经纬度', lnglat)
  }
}

// 把拿到的经纬度转化为地址信息
const getAddress = (lnglat) => {
  state.geocoder.getAddress(lnglat, (status, result) => {
    if (status === 'complete' && result.info === 'OK') {
      if (result && result.regeocode) {
        state.address = result.regeocode.formattedAddress
      }
    }
  })
}
// 显式暴露方法，使其可以被父组件访问
defineExpose({
  regeoCode
})

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
