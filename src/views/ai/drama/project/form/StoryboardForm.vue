<!-- AI 短剧：新增 / 编辑分镜；字段与单镜编辑区共用 -->
<template>
  <Dialog v-model="dialogVisible" :title="editing ? '编辑镜头' : '新增镜头'" width="820px">
    <StoryboardFields ref="fieldsRef" :detail="detail" />
    <template #footer>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import StoryboardFields from './storyboard/StoryboardFields.vue'

/** AI 短剧：分镜表单 */
defineOptions({ name: 'AiDramaStoryboardForm' })

defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [id: number] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
const editing = ref(false) // 是否编辑：否则为新增
const fieldsRef = ref() // 编辑字段 Ref

/** 打开表单：编辑时复制一份分镜，修改不影响列表；新增时默认排在最后 */
const open = async (storyboard?: DramaStoryboardVO, defaultSceneNo?: number) => {
  dialogVisible.value = true
  editing.value = !!storyboard
  await nextTick()
  fieldsRef.value.load(storyboard)
  if (!storyboard && defaultSceneNo) {
    fieldsRef.value.getState().formData.sceneNo = defaultSceneNo
  }
}
defineExpose({ open })

/** 提交表单 */
const submitForm = async () => {
  const data = fieldsRef.value.buildData()
  formLoading.value = true
  try {
    let id = data.id
    if (id) {
      await DramaStoryboardApi.updateStoryboard(data)
    } else {
      id = await DramaStoryboardApi.createStoryboard(data)
    }
    message.success('保存成功')
    dialogVisible.value = false
    emit('success', id)
  } finally {
    formLoading.value = false
  }
}
</script>
