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
    <!-- TODO @haohao：如果是独立部署，也是通过上传插件包哇？ -->
    <ContentWrap class="mt-10px">
      <el-button type="warning" plain @click="handleImport" v-hasPermi="['system:user:import']">
        <Icon icon="ep:upload" /> 上传插件包
      </el-button>
    </ContentWrap>
  </div>
  <!-- TODO @haohao：待完成：配置管理 -->
  <!-- TODO @haohao：待完成：script 管理 -->
  <!-- TODO @haohao：插件实例的前端展示：底部要不要加个分页，展示运行中的实力？默认勾选，只展示 state 为在线的 -->

  <!-- 插件导入对话框 -->
  <!-- TODO @haohao：Number 尽量不用。因为有用户会使用 snowflake、或者 string 的时候，会有问题 -->
  <PluginImportForm
    ref="importFormRef"
    :id="Number(pluginInfo.id)"
    @success="getPluginInfo(Number(pluginInfo.id))"
  />
</template>

<script lang="ts" setup>
import { PluginInfoApi, PluginInfoVO } from '@/api/iot/plugininfo'
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
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
// TODO @haohao：这里可以改成 pluginInfo.id > 0 去判断，然后 handleStatusChange disable 按钮
const isInitialLoad = ref(true) // 初始化标志位

onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    getPluginInfo(id).then(() => {
      isInitialLoad.value = false // 数据加载完成后，设置标志位为 false
    })
  }
})

/** 获取插件详情 */
const getPluginInfo = async (id: number) => {
  pluginInfo.value = await PluginInfoApi.getPluginInfo(id)
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
    // 获取详情
    await getPluginInfo(pluginInfo.value.id)
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
