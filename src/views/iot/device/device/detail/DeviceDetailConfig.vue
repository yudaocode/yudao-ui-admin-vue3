<template>
  <div>
    <el-alert
      title="IoT平台支持远程更新设备的配置文件(SON格式)，您可以在下方编辑配置模板，对设备的系统参数、网络参数等进行远程配置，通过批量更新对设备进行批量远程维护和管理。"
      type="info"
      show-icon
      class="my-4"
      description="如需编辑文件，请点击下方编辑按钮"
    />
    
    <Vue3Jsoneditor
      ref="editor"
      v-if="isEditing"
      v-model="deviceConfig"
      :options="editorOptions"
      height="500px"
      currentMode="code"
      @error="onError"
    />
    <Vue3Jsoneditor
      ref="editor"
      v-else
      v-model="deviceConfig"
      :options="editorOptions"
      height="500px"
      currentMode="view"
      @error="onError"
    />
    <div class="button-group">
      <el-button v-if="isEditing" @click="cancelEdit">取消</el-button>
      <el-button v-if="isEditing" type="primary" @click="saveConfig">保存</el-button>
      <el-button v-else @click="enableEdit">编辑</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import Vue3Jsoneditor from 'v3-jsoneditor/src/Vue3Jsoneditor.vue';

// 定义设备配置的状态
const deviceConfig = ref({
  "name": "dyla1n"
});

// 编辑状态
const isEditing = ref(false);

// JSON 编辑器的选项
const editorOptions = computed(() => ({
  mainMenuBar: false,
  navigationBar: false,
  statusBar: false,
}));

// 启用编辑模式的函数
const enableEdit = () => {
  isEditing.value = true;
};

// 取消编辑的函数
const cancelEdit = () => {
  isEditing.value = false;
  // 逻辑代码
  console.log('取消编辑');
};

// 保存配置的函数
const saveConfig = () => {
  isEditing.value = false;
  // 逻辑代码
  console.log('保存配置');
};

// 处理 JSON 编辑器错误的函数
const onError = (e: any) => {
  console.log('onError', e);
};
</script>

<style scoped>
.button-group {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>