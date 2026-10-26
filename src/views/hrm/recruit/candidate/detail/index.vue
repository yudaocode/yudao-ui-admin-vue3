<template>
  <RecruitCandidateDetailsHeader :candidate="candidate" :loading="loading">
    <el-button
      v-hasPermi="['hrm:recruit:candidate:update']"
      :disabled="!candidate.id"
      type="primary"
      @click="openForm"
    >
      <Icon class="mr-5px" icon="ep:edit" />编辑
    </el-button>
  </RecruitCandidateDetailsHeader>
  <el-col>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="详细资料" name="detail">
        <RecruitCandidateDetailsInfo :candidate="candidate" />
      </el-tab-pane>
      <el-tab-pane label="材料附件" name="file" lazy>
        <RecruitCandidateMaterialFiles :candidate="candidate" />
      </el-tab-pane>
      <el-tab-pane label="面试记录" name="interview" lazy>
        <RecruitCandidateInterviewList :interview-list="interviewList" />
      </el-tab-pane>
      <el-tab-pane label="操作记录" name="operateLog">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <RecruitCandidateForm ref="formRef" @success="getCandidate" />
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import { useTagsViewStore } from '@/store/modules/tagsView'
import type { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/hrm/operate-log'
import * as RecruitCandidateApi from '@/api/hrm/recruit/candidate'
import * as RecruitInterviewApi from '@/api/hrm/recruit/interview'
import RecruitCandidateForm from '@/views/hrm/recruit/candidate/RecruitCandidateForm.vue'
import { HrmBizType } from '@/views/hrm/utils/constants'
import RecruitCandidateDetailsHeader from './RecruitCandidateDetailsHeader.vue'
import RecruitCandidateDetailsInfo from './RecruitCandidateDetailsInfo.vue'
import RecruitCandidateInterviewList from './RecruitCandidateInterviewList.vue'
import RecruitCandidateMaterialFiles from './RecruitCandidateMaterialFiles.vue'

defineOptions({ name: 'HrmRecruitCandidateDetail' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const candidateId = (parseId(route.params.id) as number) // 招聘候选人编号
const loading = ref(true) // 详情的加载中
const activeTab = ref('detail') // 当前选中的页签
const candidate = ref<RecruitCandidateApi.HrmRecruitCandidateVO>(
  {} as RecruitCandidateApi.HrmRecruitCandidateVO
) // 候选人详情

/** 关闭窗口 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmRecruitCandidate' })
}

/** 获取详情 */
async function getCandidate() {
  loading.value = true
  try {
    const data = await RecruitCandidateApi.getRecruitCandidate(candidateId)
    if (!data) {
      message.warning('招聘候选人不存在')
      close()
      return
    }
    candidate.value = data
    await Promise.all([getInterviewList(), getOperateLog()])
  } finally {
    loading.value = false
  }
}

const interviewList = ref<RecruitInterviewApi.HrmRecruitInterviewVO[]>([]) // 面试记录列表

/** 获取面试记录 */
async function getInterviewList() {
  interviewList.value = await RecruitInterviewApi.getRecruitInterviewListByCandidate(candidateId)
}

const logList = ref<OperateLogVO[]>([]) // 操作日志列表

/** 获取操作日志 */
async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.RECRUIT_CANDIDATE,
    bizId: candidateId
  })
  logList.value = data.list
}

const formRef = ref<InstanceType<typeof RecruitCandidateForm>>() // 表单 Ref

/** 编辑 */
function openForm() {
  formRef.value?.open('update', candidateId)
}

/** 初始化 */
onMounted(async () => {
  if (!isPositiveId(candidateId)) {
    message.warning('参数错误，招聘候选人不能为空！')
    close()
    return
  }
  await getCandidate()
})
</script>
