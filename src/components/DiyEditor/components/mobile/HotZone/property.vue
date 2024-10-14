<template>
  <ComponentContainerProperty v-model="formData.style">
    <!-- 表单 -->
    <el-form label-width="80px" :model="formData" class="m-t-8px">
      <el-form-item label="上传图片" prop="imgUrl">
        <UploadImg v-model="formData.imgUrl" height="50px" width="auto" class="min-w-80px">
          <template #tip>
            <el-text type="info" size="small"> 推荐宽度 750</el-text>
          </template>
        </UploadImg>
      </el-form-item>
    </el-form>

    <el-button type="primary" plain class="w-full" @click="handleOpenEditDialog">
      设置热区
    </el-button>
  </ComponentContainerProperty>
  <!-- 热区编辑对话框 -->
  <HotZoneEditDialog ref="editDialogRef" v-model="formData.list" :img-url="formData.imgUrl" />
</template>

<script setup lang="ts">
import { usePropertyForm } from '@/components/DiyEditor/util'
import { HotZoneProperty } from '@/components/DiyEditor/components/mobile/HotZone/config'
import HotZoneEditDialog from './components/HotZoneEditDialog/index.vue'

/** 热区属性面板 */
defineOptions({ name: 'HotZoneProperty' })

const props = defineProps<{ modelValue: HotZoneProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

// 热区编辑对话框
const editDialogRef = ref()
// 打开热区编辑对话框
const handleOpenEditDialog = () => {
  editDialogRef.value.open()
}
</script>

<style scoped lang="scss">
.hot-zone {
  position: absolute;
  background: #409effbf;
  border: 1px solid var(--el-color-primary);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;

  /* 控制点 */
  .ctrl-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #fff;
  }
}
</style>
