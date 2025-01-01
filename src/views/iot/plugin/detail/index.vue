<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">插件详情</span>
          </el-row>
        </el-col>
      </div>
    </div>
    <ContentWrap class="mt-10px">
      <el-descriptions :column="2" direction="horizontal">
        <el-descriptions-item label="插件名称">
          {{ pluginInfo.name }}
        </el-descriptions-item>
        <el-descriptions-item label="插件标识">
          {{ pluginInfo.pluginKey }}
        </el-descriptions-item>
        <el-descriptions-item label="版本号">
          {{ pluginInfo.version }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-switch
            v-model="pluginInfo.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange"
          />
        </el-descriptions-item>
        <el-descriptions-item label="插件描述">
          {{ pluginInfo.description }}
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>
    <ContentWrap class="mt-10px">
      <el-button type="warning" plain @click="handleImport" v-hasPermi="['system:user:import']">
        <Icon icon="ep:upload" /> 上传插件包
      </el-button>
    </ContentWrap>
  </div>
  <!-- 插件导入对话框 -->
  <PluginImportForm
    ref="importFormRef"
    :id="Number(pluginInfo.id)"
    @success="getPluginInfo(Number(pluginInfo.id))"
  />
</template>

<script lang="ts" setup>
import { PluginInfoApi, PluginInfoVO } from '@/api/iot/plugininfo'
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import PluginImportForm from './PluginImportForm.vue'

const message = useMessage()
const route = useRoute()
const pluginInfo = ref<PluginInfoVO>({
  id: 0,
  pluginKey: '',
  name: '',
  description: '',
  version: '',
  status: 0,
  deployType: 0,
  fileName: '',
  type: 0,
  protocol: '',
  configSchema: '',
  config: '',
  script: ''
})
const isInitialLoad = ref(true) // 初始化标志位

onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    getPluginInfo(id).then(() => {
      isInitialLoad.value = false // 数据加载完成后，设置标志位为 false
    })
  }
})

const getPluginInfo = async (id: number) => {
  const data = await PluginInfoApi.getPluginInfo(id)
  pluginInfo.value = data
}

/** 处理状态变更 */
const handleStatusChange = async (status: number) => {
  if (isInitialLoad.value) {
    return
  }
  try {
    // 修改状态的二次确认
    const text = status === 1 ? '启用' : '停用'
    await message.confirm('确认要"' + text + '"插件吗?')
    await PluginInfoApi.updatePluginStatus({
      id: pluginInfo.value.id,
      status
    })
    message.success('更新状态成功')
    getPluginInfo(Number(pluginInfo.value.id))
  } catch (error) {
    pluginInfo.value.status = status === 1 ? 0 : 1
    message.error('更新状态失败')
  }
}

/** 插件导入 */
const importFormRef = ref()
const handleImport = () => {
  importFormRef.value.open()
}
</script>
