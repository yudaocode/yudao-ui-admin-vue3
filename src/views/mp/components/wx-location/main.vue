<!--
  【微信消息 - 定位】TODO @Dhb52 目前未启用
-->
<template>
  <div>
    <el-link
      type="primary"
      target="_blank"
      :href="
        'https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=' +
        locationY +
        '&pointy=' +
        locationX +
        '&name=' +
        label +
        '&ref=yudao'
      "
    >
      <el-col>
        <el-row>
          <img
            :src="
              'https://apis.map.qq.com/ws/staticmap/v2/?zoom=10&markers=color:blue|label:A|' +
              locationX +
              ',' +
              locationY +
              '&key=' +
              qqMapKey +
              '&size=250*180'
            "
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
defineOptions({ name: 'WxLocation' })

const props = defineProps({
  locationX: {
    required: true,
    type: Number
  },
  locationY: {
    required: true,
    type: Number
  },
  label: {
    // 地名
    required: true,
    type: String
  },
  qqMapKey: {
    // QQ 地图的密钥 https://lbs.qq.com/service/staticV2/staticGuide/staticDoc
    required: false,
    type: String,
    default: 'TVDBZ-TDILD-4ON4B-PFDZA-RNLKH-VVF6E' // 需要自定义
  }
})

defineExpose({
  locationX: props.locationX,
  locationY: props.locationY,
  label: props.label,
  qqMapKey: props.qqMapKey
})
</script>
