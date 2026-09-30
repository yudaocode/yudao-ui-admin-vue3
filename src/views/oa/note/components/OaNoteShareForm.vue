<template>
  <!-- 笔记共享设置，独立于内容编辑 -->
  <Dialog v-model="dialogVisible" title="共享笔记" width="600px">
    <el-form v-loading="formLoading" label-width="80px">
      <el-form-item label="笔记标题">{{ title }}</el-form-item>
      <el-form-item label="共享给">
        <UserSelectV2 v-model="receiverUserIds" multiple placeholder="请选择共享接收人" />
      </el-form-item>
      <div class="text-13px text-gray-500">清空接收人后保存，将取消这篇笔记的全部共享。</div>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as NoteApi from '@/api/oa/note'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'OaNoteShareForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 表单是否展示
const formLoading = ref(false) // 加载及提交中
const noteId = ref<number>() // 笔记编号
const title = ref('') // 笔记标题
const receiverUserIds = ref<number[]>([]) // 当前接收人
const emit = defineEmits<{ success: [] }>() // 保存成功通知

/** 打开共享表单 */
async function open(id: number) {
  dialogVisible.value = true
  noteId.value = undefined
  title.value = ''
  receiverUserIds.value = []
  formLoading.value = true
  try {
    // 获取最新共享关系，不使用列表中的旧接收人
    const note: NoteApi.OaNoteVO = await NoteApi.getNote(id)
    noteId.value = id
    title.value = note.title
    receiverUserIds.value = note.receiverUserIds || []
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 保存共享设置 */
async function submitForm() {
  if (formLoading.value || noteId.value === undefined) return
  formLoading.value = true
  try {
    // 仅提交接收人，避免覆盖笔记正文和其他字段
    await NoteApi.updateNoteShare(noteId.value, receiverUserIds.value)
    message.success('共享设置成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
