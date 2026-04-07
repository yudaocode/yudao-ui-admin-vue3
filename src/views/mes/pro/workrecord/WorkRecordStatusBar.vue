<!-- 我的工作站 - 上下工状态栏 -->
<template>
  <div
    class="flex items-center justify-between p-12px mb-16px rounded-8px border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
  >
    <div class="flex items-center gap-8px">
      <span class="font-600 text-14px text-[var(--el-text-color-primary)]">我的工作站</span>
      <el-divider direction="vertical" />
      <template v-if="isClockIn">
        <el-tag type="success" effect="plain" round class="!inline-flex !items-center">
          <Icon icon="ep:check" class="mr-4px" />
          {{ myWorkstation!.workstationCode }} - {{ myWorkstation!.workstationName }}
        </el-tag>
        <span class="ml-4px text-13px text-[var(--el-text-color-secondary)]">
          上工时间：{{ formatDate(myWorkstation!.clockInTime) }}
        </span>
      </template>
      <template v-else>
        <el-tag type="info" effect="plain" round>当前未上工</el-tag>
      </template>
    </div>
    <div class="flex-shrink-0">
      <el-popover
        v-if="!isClockIn"
        :visible="clockInPopoverVisible"
        placement="bottom-end"
        :width="320"
        trigger="click"
      >
        <template #reference>
          <el-button type="success" plain @click="clockInPopoverVisible = true">
            <Icon icon="ep:video-play" class="mr-5px" /> 上工
          </el-button>
        </template>
        <div>
          <p class="mb-8px font-bold">选择工作站</p>
          <MdWorkstationSelect
            v-model="selectedWorkstationId"
            placeholder="请选择工作站"
            class="w-full"
          />
          <div class="mt-12px text-right">
            <el-button size="small" @click="clockInPopoverVisible = false">取消</el-button>
            <el-button
              size="small"
              type="success"
              :disabled="!selectedWorkstationId"
              @click="handleClockIn"
            >
              确认上工
            </el-button>
          </div>
        </div>
      </el-popover>
      <el-button v-if="isClockIn" type="danger" plain @click="handleClockOut">
        <Icon icon="ep:video-pause" class="mr-5px" /> 下工
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { ProWorkRecordApi, type ProWorkRecordVO } from '@/api/mes/pro/workrecord'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import { MesProWorkRecordTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'WorkRecordStatusBar' })

const emit = defineEmits<{
  (e: 'change'): void // 上工/下工操作完成后触发，通知父组件刷新列表
}>()

const message = useMessage() // 消息弹窗

const myWorkstation = ref<ProWorkRecordVO | null>(null) // 当前工作站绑定状态
const clockInPopoverVisible = ref(false) // 上工弹窗是否可见
const selectedWorkstationId = ref<number>() // 选中的工作站编号
const isClockIn = computed(() => myWorkstation.value?.type === MesProWorkRecordTypeEnum.CLOCK_IN) // 是否处于上工状态

/** 查询当前用户工作站 */
const loadMyWorkstation = async () => {
  myWorkstation.value = await ProWorkRecordApi.getMyWorkRecord()
}

/** 上工 */
const handleClockIn = async () => {
  if (!selectedWorkstationId.value) {
    return
  }
  try {
    await ProWorkRecordApi.clockInWorkRecord(selectedWorkstationId.value)
    message.success('上工成功')
    clockInPopoverVisible.value = false
    selectedWorkstationId.value = undefined
    await loadMyWorkstation()
    emit('change')
  } catch {}
}

/** 下工 */
const handleClockOut = async () => {
  try {
    await message.confirm('确认下工当前工作站？')
    await ProWorkRecordApi.clockOutWorkRecord()
    message.success('下工成功')
    await loadMyWorkstation()
    emit('change')
  } catch {}
}

/** 初始化 */
onMounted(() => loadMyWorkstation())
</script>
