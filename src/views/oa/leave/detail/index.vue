<template>
  <div v-loading="detailLoading">
    <!-- 请假申请信息 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="标题" :span="2"> {{ detailData.title }} </el-descriptions-item>
      <el-descriptions-item label="紧急程度">
        <DictTag :type="DICT_TYPE.OA_APPLY_URGENCY" :value="detailData.urgency ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="请假类型">
        <DictTag :type="DICT_TYPE.OA_LEAVE_TYPE" :value="detailData.type ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatDate(detailData.startTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="申请原因" :span="2">
        <span class="whitespace-pre-wrap break-words">{{ detailData.reason }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detailData.fileUrls" disabled :is-show-tip="false" />
      </el-descriptions-item>
      <el-descriptions-item label="天数"> {{ detailData.days }} 天 </el-descriptions-item>
      <el-descriptions-item label="申请人"> {{ detailData.creatorName }} </el-descriptions-item>
      <el-descriptions-item label="申请时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="审批状态">
        <el-tag v-if="detailData.status === BpmProcessInstanceStatus.NOT_START" type="info">
          未提交
        </el-tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detailData.status ?? ''"
        />
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
import * as LeaveApplyApi from '@/api/oa/leave'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaLeaveApplyDetail' })

const props = defineProps<{ id?: number | string }>() // 请假申请编号，BPM 通过业务编号传入
const route = useRoute() // 路由参数
const detailLoading = ref(false) // 详情的加载中
const detailData = ref<LeaveApplyApi.LeaveApplyVO>({ fileUrls: [] }) // 详情数据

/** 查询详情 */
async function getInfo() {
  const id = props.id || route.params.id || route.query.id
  if (!id) return
  detailLoading.value = true
  try {
    detailData.value = await LeaveApplyApi.getLeaveApply(Number(id))
  } finally {
    detailLoading.value = false
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || route.params.id || route.query.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>
