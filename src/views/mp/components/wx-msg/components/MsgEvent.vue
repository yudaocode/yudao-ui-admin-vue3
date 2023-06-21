<template>
  <div>
    <div v-if="item.event === 'subscribe'">
      <el-tag type="success">关注</el-tag>
    </div>
    <div v-else-if="item.event === 'unsubscribe'">
      <el-tag type="danger">取消关注</el-tag>
    </div>
    <div v-else-if="item.event === 'CLICK'">
      <el-tag>点击菜单</el-tag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'VIEW'">
      <el-tag>点击菜单链接</el-tag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'scancode_waitmsg'">
      <el-tag>扫码结果</el-tag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'scancode_push'">
      <el-tag>扫码结果</el-tag>
      【{{ item.eventKey }}】
    </div>
    <div v-else-if="item.event === 'pic_sysphoto'">
      <el-tag>系统拍照发图</el-tag>
    </div>
    <div v-else-if="item.event === 'pic_photo_or_album'">
      <el-tag>拍照或者相册</el-tag>
    </div>
    <div v-else-if="item.event === 'pic_weixin'">
      <el-tag>微信相册</el-tag>
    </div>
    <div v-else-if="item.event === 'location_select'">
      <el-tag>选择地理位置</el-tag>
    </div>
    <div v-else>
      <el-tag type="danger">未知事件类型</el-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  item: any
}>()

const item = ref(props.item)
</script>
