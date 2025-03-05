<!-- 设备配置 -->
<template>
  <div>
    <el-alert
      title="支持远程更新设备的配置文件(JSON 格式)，可以在下方编辑配置模板，对设备的系统参数、网络参数等进行远程配置。配置完成后，需点击「下发」按钮，设备即可进行远程配置。"
      type="info"
      show-icon
      class="my-4"
      description="如需编辑文件，请点击下方编辑按钮"
    />

    <!-- JSON 编辑器：读模式 -->
    <Vue3Jsoneditor
      ref="editor"
      v-if="isEditing"
      v-model="deviceConfigState"
      :options="editorOptions"
      height="500px"
      currentMode="code"
      @error="onError"
    />
    <!-- JSON 编辑器：写模式 -->
    <Vue3Jsoneditor
      ref="editor"
      v-else
      v-model="deviceConfigState"
      :options="editorOptions"
      height="500px"
      currentMode="view"
      v-loading.fullscreen.lock="loading"
      @error="onError"
    />
    <div class="flex justify-center mt-24">
      <el-button v-if="isEditing" @click="cancelEdit">取消</el-button>
      <el-button v-if="isEditing" type="primary" @click="saveConfig">保存</el-button>
      <el-button v-else @click="enableEdit">编辑</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import Vue3Jsoneditor from 'v3-jsoneditor/src/Vue3Jsoneditor.vue'
import { DeviceApi } from '@/api/iot/device/device/index'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DeviceVO } from '../../../../../api/iot/device/device/index';

const route = useRoute()
const message = useMessage()
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
const id = Number(route.params.id) // 将字符串转换为数字
const loading = ref(true) // 加载中
const deviceConfigState = ref({})  // 设置配置


// 获取设备配置
const getDeviceConfig = async (id: number) => {
  try {
    loading.value = true
    const res = await DeviceApi.getDevice(id)
    deviceConfigState.value = res
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!id) {
    message.warning('参数错误，产品不能为空！')
    delView(unref(currentRoute))
    return
  }
   await getDeviceConfig(id)
})


const isEditing = ref(false) // 编辑状态
const editorOptions = computed(() => ({
  mainMenuBar: false,
  navigationBar: false,
  statusBar: false
})) // JSON 编辑器的选项

/** 启用编辑模式的函数 */
const enableEdit = () => {
  isEditing.value = true
}

/** 取消编辑的函数 */
const cancelEdit = () => {
  isEditing.value = false
  // 逻辑代码
  console.log('取消编辑')
}

/** 保存配置的函数 */
const saveConfig = async () => {
  const params = {
      ...deviceConfigState.value
    } as DeviceVO
  await updateDeviceConfig(params)
  isEditing.value = false
}

/** 处理 JSON 编辑器错误的函数 */
const onError = (e: any) => {
  console.log('onError', e)
}

// 更新设备配置
const updateDeviceConfig = async (params: DeviceVO) => {
  try {
    loading.value = true
    await DeviceApi.updateDevice(params)
    await getDeviceConfig(id)
    message.success('更新成功！')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>
