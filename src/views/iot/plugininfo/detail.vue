<template>
  <ContentWrap>
    <el-descriptions title="插件详情" :column="2" border>
      <el-descriptions-item label="插件名称">{{ pluginInfo.name }}</el-descriptions-item>
      <el-descriptions-item label="组件ID">{{ pluginInfo.pluginId }}</el-descriptions-item>
      <el-descriptions-item label="Jar包">{{ pluginInfo.file }}</el-descriptions-item>
      <el-descriptions-item label="版本号">{{ pluginInfo.version }}</el-descriptions-item>
      <el-descriptions-item label="部署方式">
        <dict-tag :type="DICT_TYPE.IOT_PLUGIN_DEPLOY_TYPE" :value="pluginInfo.deployType" />
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <dict-tag :type="DICT_TYPE.IOT_PLUGIN_STATUS" :value="pluginInfo.status" />
      </el-descriptions-item>
    </el-descriptions>
    <el-button type="primary" @click="goBack">返回</el-button>
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { PluginInfoApi, PluginInfoVO } from '@/api/iot/plugininfo'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const pluginInfo = ref<PluginInfoVO>({})

const getPluginInfo = async (id: number) => {
  const data = await PluginInfoApi.getPluginInfo(id)
  pluginInfo.value = data
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    getPluginInfo(id)
  }
})
</script>
