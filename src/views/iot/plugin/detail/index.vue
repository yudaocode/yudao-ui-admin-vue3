<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">插件配置</span>
          </el-row>
        </el-col>
      </div>
    </div>
    <ContentWrap class="mt-10px">
      <el-descriptions :column="2" direction="horizontal">
        <el-descriptions-item label="插件名称">
          {{ pluginConfig.name }}
        </el-descriptions-item>
        <el-descriptions-item label="插件标识">
          {{ pluginConfig.pluginKey }}
        </el-descriptions-item>
        <el-descriptions-item label="版本号">
          {{ pluginConfig.version }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-switch
            v-model="pluginConfig.status"
            :active-value="1"
            :inactive-value="0"
            :disabled="pluginConfig.id <= 0"
            @change="handleStatusChange"
          />
        </el-descriptions-item>
        <el-descriptions-item label="插件描述">
          {{ pluginConfig.description }}
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>
    <!-- TODO @haohao：如果是独立部署，也是通过上传插件包哇？ -->
    <ContentWrap class="mt-10px">
      <el-button type="warning" plain @click="handleImport" v-hasPermi="['system:user:import']">
        <Icon icon="ep:upload" /> 上传插件包
      </el-button>
    </ContentWrap>
  </div>
  <!-- TODO @haohao：待完成：配置管理 -->
  <!-- TODO @haohao：待完成：script 管理；可以最后搞 -->
  <!-- TODO @haohao：插件实例的前端展示：底部要不要加个分页，展示运行中的实力？默认勾选，只展示 state 为在线的 -->

  <!-- 插件导入对话框 -->
  <PluginImportForm
    ref="importFormRef"
    :id="pluginConfig.id"
    @success="getPluginConfig(pluginConfig.id)"
  />
</template>

<script lang="ts" setup>
import { PluginConfigApi, PluginConfigVO } from '@/api/iot/plugin'
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import PluginImportForm from './PluginImportForm.vue'

const message = useMessage()
const route = useRoute()
const pluginConfig = ref<PluginConfigVO>({
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

/** 获取插件配置 */
const getPluginConfig = async (id: number) => {
  pluginConfig.value = await PluginConfigApi.getPluginConfig(id)
}

/** 处理状态变更 */
const handleStatusChange = async (status: number) => {
  if (pluginConfig.value.id <= 0) {
    return
  }
  try {
    // 修改状态的二次确认
    const text = status === 1 ? '启用' : '停用'
    await message.confirm('确认要"' + text + '"插件吗?')
    await PluginConfigApi.updatePluginStatus({
      id: pluginConfig.value.id,
      status
    })
    message.success('更新状态成功')
    // 获取配置
    await getPluginConfig(pluginConfig.value.id)
  } catch (error) {
    pluginConfig.value.status = status === 1 ? 0 : 1
    message.error('更新状态失败')
  }
}

/** 插件导入 */
const importFormRef = ref()
const handleImport = () => {
  importFormRef.value.open()
}

/** 初始化插件配置 */
onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    getPluginConfig(id)
  }
})
</script>
