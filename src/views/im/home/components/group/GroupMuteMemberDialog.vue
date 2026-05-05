<template>
  <!-- 禁言时长选择弹窗 -->
  <!-- TODO @AI：样式有点丑？你看看怎么优化下？例如说，横着 radio？/Users/yunai/Downloads/iShot_2026-05-05_17.51.35.png -->
  <el-dialog v-model="visible" title="设置禁言" width="360px" :close-on-click-modal="false">
    <div class="flex flex-col gap-3">
      <div class="text-sm text-[var(--el-text-color-regular)]">
        禁言成员：<span class="font-medium text-[var(--el-text-color-primary)]">{{
          memberName
        }}</span>
      </div>
      <el-radio-group v-model="selected" class="flex flex-col gap-2">
        <el-radio v-for="opt in presets" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </el-radio>
        <el-radio :value="0">
          <div class="flex items-center gap-2">
            <span>自定义</span>
            <el-input-number
              v-model="customMinutes"
              :min="1"
              :max="43200"
              :disabled="selected !== 0"
              size="small"
              class="!w-100px"
            />
            <span class="text-sm">分钟</span>
          </div>
        </el-radio>
      </el-radio-group>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { muteMember } from '@/api/im/group'

defineOptions({ name: 'ImGroupMuteMemberDialog' })

const emit = defineEmits<{
  success: []
}>()

const { success: successMessage } = useMessage()

const visible = ref(false)
const loading = ref(false)
const groupId = ref(0)
const userId = ref(0)
const memberName = ref('')
const selected = ref(600) // 默认 10 分钟
const customMinutes = ref(30)

const presets = [
  { label: '10 分钟', value: 600 },
  { label: '1 小时', value: 3600 },
  { label: '12 小时', value: 43200 },
  { label: '1 天', value: 86400 },
  { label: '7 天', value: 604800 }
]

/** 打开弹窗 */
function open(gid: number, uid: number, name: string) {
  groupId.value = gid
  userId.value = uid
  memberName.value = name
  selected.value = 600
  customMinutes.value = 30
  visible.value = true
}

/** 确认禁言 */
async function handleConfirm() {
  const seconds = selected.value === 0 ? customMinutes.value * 60 : selected.value
  if (seconds <= 0) {
    return
  }
  loading.value = true
  try {
    await muteMember({ groupId: groupId.value, userId: userId.value, mutedSeconds: seconds })
    successMessage('禁言成功')
    visible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
