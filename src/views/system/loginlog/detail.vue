<template>
  <Dialog title="详情" v-model="modelVisible" :scroll="true" :max-height="500" width="800">
    <el-descriptions border :column="1">
      <el-descriptions-item label="日志编号" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="操作类型">
        <dict-tag :type="DICT_TYPE.SYSTEM_LOGIN_TYPE" :value="detailData.logType" />
      </el-descriptions-item>
      <el-descriptions-item label="用户名称">
        {{ detailData.username }}
      </el-descriptions-item>
      <el-descriptions-item label="登录地址">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item label="浏览器">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item label="登陆结果">
        <dict-tag :type="DICT_TYPE.SYSTEM_LOGIN_RESULT" :value="detailData.result" />
      </el-descriptions-item>
      <el-descriptions-item label="登录日期">
        {{ formatDate(detailData.createTime, 'YYYY-MM-DD HH:mm:ss') }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as LoginLogApi from '@/api/system/loginLog'

const modelVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref() // 详情数据

/** 打开弹窗 */
const openModal = async (data: LoginLogApi.LoginLogVO) => {
  modelVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = data
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗
</script>
