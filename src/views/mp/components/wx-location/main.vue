<!-- 微信消息 - 定位 -->
<template>
  <div>
    <el-link type="primary" target="_blank" rel="noopener noreferrer" :href="mapUrl">
      <el-col>
        <el-row v-if="point">
          <MapView
            :longitude="point.longitude"
            :latitude="point.latitude"
            class="pointer-events-none h-180px w-250px"
          />
        </el-row>
        <el-row>
          <Icon icon="ep:location" />
          {{ label }}
        </el-row>
      </el-col>
    </el-link>
  </div>
</template>

<script lang="ts" setup>
import { gcj02ToBd09, MapView, toMapCoordinate } from '@/components/Map'

defineOptions({ name: 'WxLocation' })

const props = defineProps({
  locationX: {
    // 纬度（微信 GCJ02）
    required: true,
    type: Number
  },
  locationY: {
    // 经度（微信 GCJ02）
    required: true,
    type: Number
  },
  label: {
    // 地名
    required: true,
    type: String
  }
})

/** 微信定位为 GCJ02，百度地图展示和外链使用 BD09 */
const point = computed(() => {
  const coordinate = toMapCoordinate(props.locationY, props.locationX)
  return coordinate ? gcj02ToBd09(coordinate.longitude, coordinate.latitude) : undefined
})

/** 百度地图标注页外链 */
const mapUrl = computed(() => {
  if (!point.value) {
    return undefined
  }
  const params = new URLSearchParams({
    location: `${point.value.latitude},${point.value.longitude}`,
    title: props.label || '位置',
    content: props.label || '',
    output: 'html',
    coord_type: 'bd09ll',
    src: 'webapp.yudao.admin'
  })
  return `https://api.map.baidu.com/marker?${params.toString()}`
})

defineExpose({
  locationX: props.locationX,
  locationY: props.locationY,
  label: props.label
})
</script>
